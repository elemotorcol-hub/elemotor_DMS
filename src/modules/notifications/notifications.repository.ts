import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

// ─── Projection helper ────────────────────────────────────────────────────────

const NOTIFICATION_SELECT = {
  id: true,
  type: true,
  title: true,
  body: true,
  entityId: true,
  entityType: true,
  read: true,
  createdAt: true,
};

// ─── Repository ───────────────────────────────────────────────────────────────

/**
 * NotificationsRepository
 *
 * Responsabilidad única: acceso a datos para el módulo de notificaciones.
 */
@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * findAllByUser — Lista las últimas 50 notificaciones del usuario, más recientes primero.
   * Si unreadOnly = true, retorna solo las no leídas.
   */
  async findAllByUser(userId: number, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: NOTIFICATION_SELECT,
    });
  }

  /**
   * getUnreadCount — Cuenta las notificaciones no leídas del usuario.
   */
  async getUnreadCount(userId: number): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  /**
   * markRead — Marca una notificación específica como leída.
   * Verifica que pertenezca al usuario para evitar acceso no autorizado.
   */
  async markRead(id: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data:  { read: true },
    });
  }

  /**
   * markAllRead — Marca todas las notificaciones del usuario como leídas.
   */
  async markAllRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data:  { read: true },
    });
  }

  /**
   * create — Persiste una nueva notificación para un usuario.
   */
  async create(data: {
    userId: number;
    type: NotificationType;
    title: string;
    body: string;
    entityId?: number;
    entityType?: string;
  }) {
    return this.prisma.notification.create({
      data,
      select: NOTIFICATION_SELECT,
    });
  }

  /**
   * findAdminUserIds — Retorna los IDs de todos los usuarios con rol admin o super_admin.
   */
  async findAdminUserIds(): Promise<number[]> {
    const users = await this.prisma.user.findMany({
      where: { role: { in: ['admin', 'super_admin'] } },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }
}
