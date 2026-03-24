import { Injectable, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { OrdersWebhookService } from './webhook/orders-webhook.service';
import { QuotesRepository } from '../quotes/quotes.repository';
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
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly webhookService: OrdersWebhookService,
    private readonly quotesRepository: QuotesRepository,
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

    return updated;
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
  async trackPublicly(trackingCode: string, identity: string) {
    // 1. Buscamos el pedido por su código de seguimiento.
    const order = await this.ordersRepository.findPublicDetail(trackingCode);
    if (!order) {
      throw new NotFoundException('No encontramos un pedido con ese código.');
    }

    // 2. Si el pedido TIENE un usuario asignado, validamos por identidad estándar (email/teléfono).
    if (order.userId) {
      const orderFull = await this.ordersRepository.findByTrackingCode(trackingCode, identity);
      if (!orderFull) {
        throw new NotFoundException(
          'No encontramos un pedido con ese código y datos de identidad.',
        );
      }
      return orderFull;
    }

    // 3. Si el pedido NO TIENE usuario (anónimo), validamos que exista una QUOTE coincidente.
    // El cliente debe proporcionar el correo que usó en la cotización.
    const validQuote = await this.quotesRepository.findByTrackingCodeAndEmail(
      trackingCode,
      identity,
    );

    if (!validQuote) {
      throw new NotFoundException(
        'No se encontró una cotización válida vinculada a este código y correo.',
      );
    }

    return order;
  }
}
