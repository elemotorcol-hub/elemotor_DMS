import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { NotificationType, TicketStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SupportTicketsRepository } from './support-tickets.repository';
import { MailService } from '../mail/mail.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

/**
 * SupportTicketsService
 *
 * Capa de lógica de negocio para el módulo de tickets de soporte.
 * Gestiona notificaciones internas al crear tickets y responder mensajes.
 */
@Injectable()
export class SupportTicketsService {
  constructor(
    private readonly ticketsRepository: SupportTicketsRepository,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  /**
   * create — Crea un ticket y notifica a todos los super_admin del nuevo ticket.
   */
  async create(userId: number, dto: CreateTicketDto) {
    const ticket = await this.ticketsRepository.create(userId, dto);

    // Obtener datos del cliente para el correo
    const client = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    // Notificaciones in-app + correo (fire-and-forget)
    this.notifySuperAdmins(ticket.id, dto.subject).catch((err) => {
      console.error('Error enviando notificaciones in-app de ticket:', err);
    });

    if (client) {
      this.mailService.sendSupportTicketNotification({
        id:          ticket.id,
        subject:     dto.subject,
        category:    dto.category ?? 'general',
        message:     dto.message,
        clientName:  client.name,
        clientEmail: client.email,
      }).catch((err) => {
        console.error('Error enviando correo de ticket:', err);
      });
    }

    return ticket;
  }

  /** Busca todos los super_admin y crea una notificación para cada uno */
  private async notifySuperAdmins(ticketId: number, subject: string) {
    const superAdmins = await this.prisma.user.findMany({
      where:  { role: UserRole.super_admin },
      select: { id: true },
    });

    if (superAdmins.length === 0) return;

    await this.prisma.notification.createMany({
      data: superAdmins.map((admin) => ({
        userId:     admin.id,
        type:       NotificationType.general,
        title:      'Nuevo ticket de soporte',
        body:       `Se ha abierto un nuevo ticket: "${subject.substring(0, 100)}"`,
        entityId:   ticketId,
        entityType: 'support_ticket',
      })),
      skipDuplicates: true,
    });
  }

  // ─── Read — Admin ─────────────────────────────────────────────────────────

  /**
   * findAll — Lista paginada de todos los tickets (solo admin/super_admin).
   */
  async findAll(query: QueryTicketsDto): Promise<PaginatedResult<any>> {
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 10;
    const { data, total } = await this.ticketsRepository.findAll(query);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Read — Client ────────────────────────────────────────────────────────

  /**
   * findAllByUser — Lista los tickets del usuario autenticado.
   */
  async findAllByUser(userId: number, query: QueryTicketsDto): Promise<PaginatedResult<any>> {
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 10;
    const { data, total } = await this.ticketsRepository.findAllByUser(userId, query);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Read — Detail ────────────────────────────────────────────────────────

  /**
   * findOne — Retorna el detalle de un ticket.
   * Verifica que el solicitante sea el propietario o un admin/super_admin.
   */
  async findOne(id: number, requestingUserId: number, requestingRole: UserRole) {
    const ticket = await this.ticketsRepository.findOne(id);
    if (!ticket) throw new NotFoundException(`Ticket #${id} no encontrado`);

    const isAdmin = requestingRole === UserRole.admin || requestingRole === UserRole.super_admin;
    const isOwner = ticket.user.id === requestingUserId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('No tienes acceso a este ticket');
    }

    return ticket;
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  /**
   * addMessage — Agrega un mensaje al ticket.
   * Si el remitente es admin, notifica al propietario del ticket.
   */
  async addMessage(
    ticketId: number,
    senderId: number,
    senderRole: UserRole,
    dto: AddMessageDto,
  ) {
    // Verificar que el ticket existe y que el solicitante tiene acceso
    const ticket = await this.ticketsRepository.findOne(ticketId);
    if (!ticket) throw new NotFoundException(`Ticket #${ticketId} no encontrado`);

    const isAdmin = senderRole === UserRole.admin || senderRole === UserRole.super_admin;
    const isOwner = ticket.user.id === senderId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('No tienes acceso a este ticket');
    }

    const message = await this.ticketsRepository.addMessage(ticketId, senderId, dto.body);

    // Si el remitente es admin/super_admin, notificar al propietario del ticket
    if (isAdmin && ticket.user.id !== senderId) {
      this.prisma.notification
        .create({
          data: {
            userId:     ticket.user.id,
            type:       NotificationType.ticket_replied,
            title:      'Respuesta a tu ticket',
            body:       dto.body.substring(0, 100),
            entityId:   ticketId,
            entityType: 'support_ticket',
          },
        })
        .catch((err) => {
          console.error('Error creando notificación de respuesta a ticket:', err);
        });
    }

    return message;
  }

  // ─── Status ───────────────────────────────────────────────────────────────

  /**
   * updateStatus — Actualiza el estado del ticket.
   * Si el nuevo estado es "resolved", notifica al propietario.
   */
  async updateStatus(id: number, dto: UpdateTicketStatusDto) {
    const ticket = await this.ticketsRepository.findOne(id);
    if (!ticket) throw new NotFoundException(`Ticket #${id} no encontrado`);

    const updated = await this.ticketsRepository.updateStatus(id, dto.status);

    if (dto.status === TicketStatus.resolved) {
      this.prisma.notification
        .create({
          data: {
            userId:     ticket.user.id,
            type:       NotificationType.ticket_resolved,
            title:      'Tu ticket fue resuelto',
            body:       `El ticket "${ticket.subject.substring(0, 80)}" ha sido marcado como resuelto.`,
            entityId:   id,
            entityType: 'support_ticket',
          },
        })
        .catch((err) => {
          console.error('Error creando notificación de ticket resuelto:', err);
        });
    }

    return updated;
  }
}
