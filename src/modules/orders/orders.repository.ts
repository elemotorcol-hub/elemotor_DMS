import { Injectable } from '@nestjs/common';
import { Prisma, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { QueryMyOrderDto } from './dto/query-my-order.dto';

// ─── Projection helpers ───────────────────────────────────────────────────────

/** Selección de campos para la lista de pedidos (admin) */
export const ORDER_LIST_SELECT = {
  id: true,
  trackingCode: true,
  status: true,
  vin: true,
  notes: true,
  estimatedDelivery: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, email: true } },
  trim: {
    select: {
      id: true,
      name: true,
      model: { select: { id: true, name: true, brand: { select: { id: true, name: true } } } },
    },
  },
  color: { select: { id: true, name: true, hexCode: true } },
} satisfies Prisma.OrderSelect;

/**
 * ORDER_MY_LIST_SELECT — Lista de pedidos del cliente.
 * Ligero: solo campos escalares + relaciones básicas.
 * El historial NO se incluye; el campo `status` ya refleja el estado actual.
 */
export const ORDER_MY_LIST_SELECT = {
  id: true,
  trackingCode: true,
  status: true,
  estimatedDelivery: true,
  createdAt: true,
  trim: {
    select: {
      id: true,
      name: true,
      model: { select: { id: true, name: true, brand: { select: { id: true, name: true } } } },
    },
  },
  color: { select: { id: true, name: true, hexCode: true } },
} satisfies Prisma.OrderSelect;

/**
 * ORDER_MY_VEHICLE_SELECT — Datos completos del vehículo para el cliente.
 * Incluye especificaciones técnicas y la imagen principal (hero).
 */
export const ORDER_MY_VEHICLE_SELECT = {
  id: true,
  trackingCode: true,
  status: true,
  vin: true,
  estimatedDelivery: true,
  createdAt: true,
  trim: {
    select: {
      id: true,
      name: true,
      spec: true,
      images: {
        orderBy: { sortOrder: 'asc' },
        select: { url: true },
      },
      model: {
        select: {
          id: true,
          name: true,
          year: true,
          brand: { select: { id: true, name: true } },
        },
      },
    },
  },
  color: { select: { id: true, name: true, hexCode: true } },
} satisfies Prisma.OrderSelect;

/**
 * ORDER_MY_DETAIL_SELECT — Detalle de un pedido del cliente.
 * Incluye historial completo de estados ordenado cronológicamente.
 */
export const ORDER_MY_DETAIL_SELECT = {
  id: true,
  trackingCode: true,
  status: true,
  estimatedDelivery: true,
  vin: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  trim: {
    select: {
      id: true,
      name: true,
      model: { select: { id: true, name: true, brand: { select: { id: true, name: true } } } },
    },
  },
  color: { select: { id: true, name: true, hexCode: true } },
  statusHistory: {
    orderBy: { date: 'asc' as const },
    select: {
      id: true,
      previousStatus: true,
      status: true,
      description: true,
      date: true,
      updatedBy: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.OrderSelect;

/**
 * OrdersRepository
 *
 * Centraliza toda la capa de acceso a datos del módulo de pedidos.
 * El servicio NO accede directamente a PrismaService (principios DIP + SRP).
 */
@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Tracking code ─────────────────────────────────────────────────────────

  /**
   * generateTrackingCode — Genera de forma atómica un código ELE-YYYY-NNNNN.
   *
   * Usa una transacción serializada sobre `tracking_counters`:
   *  1. upsert del registro del año actual.
   *  2. incremento atómico de `lastSeq`.
   *  3. Retorna el nuevo valor como código formateado.
   *
   * La atomicidad de Prisma `update({ data: { lastSeq: { increment: 1 } } })`
   * + `select: { lastSeq: true }` garantiza que en concurrencia cada llamada
   * obtiene un número diferente.
   */
  async generateTrackingCode(year: number): Promise<string> {
    const counter = await this.prisma.$transaction(async (tx) => {
      // Garantiza que exista el registro del año
      await tx.trackingCounter.upsert({
        where: { year },
        create: { year, lastSeq: 0 },
        update: {},
      });

      // Incremento atómico — el valor retornado es el número "ganado"
      return tx.trackingCounter.update({
        where: { year },
        data: { lastSeq: { increment: 1 } },
        select: { lastSeq: true },
      });
    });

    const seq = counter.lastSeq.toString().padStart(5, '0');
    return `ELE-${year}-${seq}`;
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  /**
   * create — Crea el pedido y su historial inicial en una sola transacción.
   */
  async create(
    dto: CreateOrderDto,
    trackingCode: string,
    createdByAdminId: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: dto.userId,
          trimId: dto.trimId,
          colorId: dto.colorId,
          trackingCode,
          status: OrderStatus.confirmed,
          vin: dto.vin,
          notes: dto.notes,
          estimatedDelivery: dto.estimatedDelivery
            ? new Date(dto.estimatedDelivery)
            : undefined,
        },
        select: ORDER_LIST_SELECT,
      });

      // Registro inicial de estado en el historial
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: null,
          status: OrderStatus.confirmed,
          description: 'Pedido creado y confirmado.',
          updatedById: createdByAdminId,
        },
      });

      return order;
    });
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  /** buildWhere — Construye el filtro dinámico para las queries de lista */
  private buildWhere(filters: QueryOrderDto): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = {};

    if (filters.status) where.status = filters.status;
    if (filters.userId) where.userId = filters.userId;

    if (filters.from || filters.to) {
      where.createdAt = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      };
    }

    return where;
  }

  async findMany(filters: QueryOrderDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;
    const sortBy = filters.sortBy ?? 'createdAt';
    const order = filters.order ?? 'desc';
    const where = this.buildWhere(filters);

    return this.prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
      select: ORDER_LIST_SELECT,
    });
  }

  async count(filters: QueryOrderDto): Promise<number> {
    return this.prisma.order.count({ where: this.buildWhere(filters) });
  }

  /** findByIdAdmin — Detalle completo para admin */
  async findByIdAdmin(id: number) {
    return this.prisma.order.findUnique({
      where: { id },
      select: {
        ...ORDER_LIST_SELECT,
        statusHistory: {
          orderBy: { date: 'asc' },
          select: {
            id: true,
            previousStatus: true,
            status: true,
            description: true,
            date: true,
            updatedBy: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  /**
   * checkExistenceAndStatus — Optimizado para updates.
   * Evita el over-fetching de relaciones (prevent performance bottleneck).
   */
  async checkExistenceAndStatus(id: number) {
    return this.prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
  }

  /** findByUserId — Pedidos propios del cliente (listado). Usa select ligero sin historial. */
  async findByUserId(userId: number, filters: QueryMyOrderDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { userId };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: ORDER_MY_LIST_SELECT,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total };
  }

  /** findByIdAndUserId — Detalle propio con historial completo (ownership check en DB). */
  async findByIdAndUserId(id: number, userId: number) {
    return this.prisma.order.findFirst({
      where: { id, userId },
      select: ORDER_MY_DETAIL_SELECT,
    });
  }

  /** findMyVehicle — Obtiene el vehículo más reciente del cliente con especificaciones completas. */
  async findMyVehicle(userId: number) {
    return this.prisma.order.findFirst({
      where: { 
        userId,
        status: {
          in: [
            OrderStatus.confirmed,
            OrderStatus.port_origin,
            OrderStatus.transit,
            OrderStatus.customs,
            OrderStatus.nationalization,
            OrderStatus.ready,
            OrderStatus.delivered
          ]
        }
      },
      orderBy: { createdAt: 'desc' },
      select: ORDER_MY_VEHICLE_SELECT,
    });
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  /** update — Edita VIN, notas y fecha estimada */
  async update(id: number, dto: UpdateOrderDto) {
    return this.prisma.order.update({
      where: { id },
      data: {
        ...(dto.vin !== undefined ? { vin: dto.vin } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.estimatedDelivery !== undefined
          ? { estimatedDelivery: new Date(dto.estimatedDelivery) }
          : {}),
      },
      select: ORDER_LIST_SELECT,
    });
  }

  /**
   * updateStatus — Cambia el estado y registra el historial en una transacción.
   */
  async updateStatus(
    id: number,
    currentStatus: OrderStatus,
    dto: UpdateOrderStatusDto,
    changedById: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: { status: dto.status },
        select: ORDER_LIST_SELECT,
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          previousStatus: currentStatus,
          status: dto.status,
          description: dto.description,
          updatedById: changedById,
        },
      });

      return order;
    });
  }
}
