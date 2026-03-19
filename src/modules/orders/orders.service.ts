import { Injectable, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { OrdersWebhookService } from './webhook/orders-webhook.service';
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
  ) {}

  // ─── Admin: Crear pedido ───────────────────────────────────────────────────

  /**
   * create — Genera el tracking code de forma atómica y crea el pedido
   * junto con su historial inicial en una transacción.
   */
  async create(dto: CreateOrderDto, adminId: number) {
    const year = new Date().getFullYear();
    const trackingCode = await this.ordersRepository.generateTrackingCode(year);
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
}
