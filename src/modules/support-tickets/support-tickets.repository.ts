import { Injectable } from '@nestjs/common';
import { Prisma, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';

// ─── Projection helpers ────────────────────────────────────────────────────────

/** Proyección para lista de tickets (admin) */
export const TICKET_LIST_SELECT = {
  id: true,
  subject: true,
  category: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, email: true } },
  _count: { select: { messages: true } },
  messages: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    select: {
      id: true,
      body: true,
      createdAt: true,
      sender: { select: { id: true, name: true, role: true } },
    },
  },
} satisfies Prisma.SupportTicketSelect;

/** Proyección para detalle de ticket con todos los mensajes */
export const TICKET_DETAIL_SELECT = {
  id: true,
  subject: true,
  category: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, email: true, role: true } },
  messages: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true,
      body: true,
      createdAt: true,
      sender: { select: { id: true, name: true, role: true } },
    },
  },
} satisfies Prisma.SupportTicketSelect;

// ─── Repository ───────────────────────────────────────────────────────────────

/**
 * SupportTicketsRepository
 *
 * Responsabilidad única: acceso a datos para el módulo de tickets de soporte.
 * El service nunca toca PrismaService directamente (DIP).
 */
@Injectable()
export class SupportTicketsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * create — Crea un ticket nuevo junto con su primer mensaje en una transacción.
   */
  async create(userId: number, dto: CreateTicketDto) {
    return this.prisma.supportTicket.create({
      data: {
        userId,
        subject: dto.subject,
        category: dto.category,
        messages: {
          create: {
            senderId: userId,
            body: dto.message,
          },
        },
      },
      select: TICKET_DETAIL_SELECT,
    });
  }

  // ─── Read — Admin ─────────────────────────────────────────────────────────

  /** Builds the Prisma WHERE clause from admin query filters */
  private buildWhere(filters: QueryTicketsDto): Prisma.SupportTicketWhereInput {
    const where: Prisma.SupportTicketWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.userId) where.userId = filters.userId;
    return where;
  }

  /**
   * findAll — Lista paginada de tickets para administradores.
   * Incluye usuario, conteo de mensajes y último mensaje.
   */
  async findAll(query: QueryTicketsDto) {
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 10;
    const skip  = (page - 1) * limit;
    const where = this.buildWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: TICKET_LIST_SELECT,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { data, total };
  }

  // ─── Read — Client ────────────────────────────────────────────────────────

  /**
   * findAllByUser — Lista paginada de tickets del usuario autenticado.
   */
  async findAllByUser(userId: number, query: QueryTicketsDto) {
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 10;
    const skip  = (page - 1) * limit;

    const where: Prisma.SupportTicketWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: TICKET_LIST_SELECT,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { data, total };
  }

  // ─── Read — Detail ────────────────────────────────────────────────────────

  /**
   * findOne — Detalle completo del ticket con todos sus mensajes.
   */
  async findOne(id: number) {
    return this.prisma.supportTicket.findUnique({
      where: { id },
      select: TICKET_DETAIL_SELECT,
    });
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  /**
   * addMessage — Agrega un mensaje al ticket y actualiza updatedAt del ticket.
   */
  async addMessage(ticketId: number, senderId: number, body: string) {
    // Creamos el mensaje y actualizamos el ticket en paralelo
    const [message] = await Promise.all([
      this.prisma.supportMessage.create({
        data: { ticketId, senderId, body },
        select: {
          id: true,
          body: true,
          createdAt: true,
          sender: { select: { id: true, name: true, role: true } },
        },
      }),
      this.prisma.supportTicket.update({
        where: { id: ticketId },
        data:  { updatedAt: new Date() },
        select: { id: true },
      }),
    ]);

    return message;
  }

  // ─── Status ───────────────────────────────────────────────────────────────

  /**
   * updateStatus — Actualiza el estado del ticket.
   */
  async updateStatus(id: number, status: TicketStatus) {
    return this.prisma.supportTicket.update({
      where: { id },
      data:  { status },
      select: TICKET_DETAIL_SELECT,
    });
  }
}
