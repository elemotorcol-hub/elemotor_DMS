import { Injectable, NotFoundException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { OrdersWebhookService } from './webhook/orders-webhook.service';
import { QuotesRepository } from '../quotes/quotes.repository';
import { UploadService } from '../upload/upload.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { QueryMyOrderDto } from './dto/query-my-order.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

/**
 * OrdersService
 *
 * Capa de lógica de negocio del módulo de pedidos.
 * Aplica principios SOLID: delega acceso a datos al Repository (DIP)
 * y mantiene una sola responsabilidad por método (SRP).
 */
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly webhookService: OrdersWebhookService,
    private readonly quotesRepository: QuotesRepository,
    private readonly uploadService: UploadService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Admin: Crear pedido ───────────────────────────────────────────────────

  /**
   * create — Genera el tracking code de forma atómica y crea el pedido
   * junto con su historial inicial en una transacción.
   */
  async create(dto: CreateOrderDto, adminId: number) {
    // Si el administrador proporciona un código de seguimiento (p.ej. de una cotización), lo usamos.
    // De lo contrario, generamos uno nuevo.
    let trackingCode = dto.trackingCode;
    if (!trackingCode) {
      const year = new Date().getFullYear();
      trackingCode = await this.ordersRepository.generateTrackingCode(year);
    }

    return this.ordersRepository.create(dto, trackingCode, adminId);
  }

  // ─── Admin: Listar pedidos con filtros ────────────────────────────────────

  async findAll(query: QueryOrderDto): Promise<PaginatedResult<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [data, total] = await Promise.all([
      this.ordersRepository.findMany(query),
      this.ordersRepository.count(query),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Admin: Detalle del pedido ────────────────────────────────────────────

  async findOne(id: number) {
    const order = await this.ordersRepository.findByIdAdmin(id);
    if (!order) {
      throw new NotFoundException(`Pedido #${id} no encontrado`);
    }
    return order;
  }

  // ─── Admin: Editar pedido ─────────────────────────────────────────────────

  /**
   * update — Solo permite modificar vin, notes y estimatedDelivery.
   * El DTO ya excluye trackingCode y userId; el ValidationPipe
   * los rechazará si el cliente los envía (forbidNonWhitelisted).
   */
  async update(id: number, dto: UpdateOrderDto) {
    const existing = await this.ordersRepository.checkExistenceAndStatus(id);
    if (!existing) {
      throw new NotFoundException(`Pedido #${id} no encontrado`);
    }
    return this.ordersRepository.update(id, dto);
  }

  // ─── Admin: Cambiar estado ────────────────────────────────────────────────

  /**
   * changeStatus — Valida que el pedido existe, actualiza el estado
   * y el historial en una transacción, luego dispara el webhook async.
   */
  async changeStatus(id: number, dto: UpdateOrderStatusDto, changedById: number) {
    const existing = await this.ordersRepository.checkExistenceAndStatus(id);
    if (!existing) {
      throw new NotFoundException(`Pedido #${id} no encontrado`);
    }

    const updated = await this.ordersRepository.updateStatus(
      id,
      existing.status,
      dto,
      changedById,
    );

    // Webhook fire-and-forget: no bloquea la respuesta al cliente
    this.webhookService.fire({
      orderId: id,
      trackingCode: updated.trackingCode,
      previousStatus: existing.status,
      newStatus: dto.status,
      changedById,
      timestamp: new Date().toISOString(),
    });

    // Notificación interna al cliente si tiene cuenta vinculada
    if (updated.user?.id) {
      this.notificationsService.notify({
        userId: updated.user.id,
        type: 'order_status_changed',
        title: 'Tu pedido fue actualizado',
        body: `El estado de tu pedido ${updated.trackingCode} cambió a: ${dto.status}`,
        entityId: id,
        entityType: 'order',
      }).catch(() => void 0);
    }

    return updated;
  }

  // ─── Admin: Vincular pedido a usuario ────────────────────────────────────

  async linkUser(orderId: number, email: string) {
    const user = await this.ordersRepository.linkUserByEmail(orderId, email);
    if (!user) {
      throw new NotFoundException(`No se encontró ningún usuario con email "${email}"`);
    }
    return { message: `Pedido vinculado a ${user.name} (${user.email})`, userId: user.id };
  }

  // ─── Cliente: Mis pedidos ─────────────────────────────────────────────────

  async findMyOrders(userId: number, query: QueryMyOrderDto): Promise<PaginatedResult<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const { data, total } = await this.ordersRepository.findByUserId(userId, query);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Cliente: Detalle de mi pedido ───────────────────────────────────────

  /**
   * findMyOrder — Ownership check a nivel de BD:
   * `where: { id, userId }`. Si no coincide → 404 (no revela existencia).
   */
  async findMyOrder(id: number, userId: number) {
    const order = await this.ordersRepository.findByIdAndUserId(id, userId);
    if (!order) {
      throw new NotFoundException(`Pedido #${id} no encontrado`);
    }
    return order;
  }

  // ─── Público: Rastreo sin autenticación ──────────────────────────────────

  /**
   * trackPublicly — Busca un pedido por código de seguimiento e identidad.
   * Si no coincide el código + identidad → 404 genérico (no revela existencia).
   */
  async trackPublicly(trackingCode: string) {
    try {
      const order = await this.ordersRepository.findPublicDetail(trackingCode);
      if (!order) {
        throw new NotFoundException('No encontramos un pedido con ese código.');
      }
      return order;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('trackPublicly ERROR:', error instanceof Error ? error.stack : String(error));
      throw new HttpException(
        { message: 'Error al rastrear pedido', detail: error instanceof Error ? error.message : String(error) },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * findMyVehicle — Retorna el vehículo actual del usuario autenticado
   * con sus especificaciones completas para el dashboard.
   */
  async findMyVehicle(userId: number) {
    const vehicle = await this.ordersRepository.findMyVehicle(userId);
    if (!vehicle) {
      throw new NotFoundException(`No hay vehículos asignados a este usuario`);
    }
    return vehicle;
  }

  /**
   * getDeliveredOrder — Retorna el pedido entregado del cliente con la fecha de entrega.
   * Retorna null si el usuario no tiene un pedido en estado "delivered".
   */
  async getDeliveredOrder(userId: number) {
    return this.ordersRepository.findDeliveredOrder(userId);
  }

  // ─── Foto de entrega ──────────────────────────────────────────────────────

  /** uploadDeliveryPhoto — Sube la foto de entrega de un pedido a Cloudinary y guarda la URL. */
  async uploadDeliveryPhoto(orderId: number, file: Express.Multer.File) {
    const existing = await this.ordersRepository.findPhotoData(orderId);
    if (!existing) throw new NotFoundException(`Pedido #${orderId} no encontrado`);

    // Eliminar foto anterior si existe
    if (existing.deliveryPhotoPublicId) {
      await this.uploadService.deleteFile(existing.deliveryPhotoPublicId, 'image');
    }

    const uploaded = await this.uploadService.uploadImage(file, 'elemotor/delivery-photos');
    return this.ordersRepository.updateDeliveryPhoto(orderId, uploaded.publicUrl, uploaded.publicId);
  }

  /** removeDeliveryPhoto — Elimina la foto de entrega de Cloudinary y limpia la BD. */
  async removeDeliveryPhoto(orderId: number) {
    const publicId = await this.ordersRepository.clearDeliveryPhoto(orderId);
    if (publicId) {
      await this.uploadService.deleteFile(publicId, 'image');
    }
    return { success: true };
  }

  /** getDeliveryPhotos — Lista pública de fotos de entrega subidas. */
  async getDeliveryPhotos() {
    return this.ordersRepository.findDeliveryPhotos();
  }
}
