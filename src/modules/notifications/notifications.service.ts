import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationsRepository } from './notifications.repository';

/**
 * NotificationsService
 *
 * Capa de lógica de negocio para el módulo de notificaciones.
 * Delega el acceso a datos al NotificationsRepository.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  /**
   * getMyNotifications — Retorna las últimas 50 notificaciones del usuario autenticado.
   */
  async getMyNotifications(userId: number) {
    return this.notificationsRepository.findAllByUser(userId);
  }

  /**
   * getUnreadCount — Retorna el conteo de notificaciones no leídas.
   */
  async getUnreadCount(userId: number) {
    const count = await this.notificationsRepository.getUnreadCount(userId);
    return { unreadCount: count };
  }

  /**
   * markRead — Marca una notificación específica como leída.
   */
  async markRead(id: number, userId: number) {
    return this.notificationsRepository.markRead(id, userId);
  }

  /**
   * markAllRead — Marca todas las notificaciones del usuario como leídas.
   */
  async markAllRead(userId: number) {
    return this.notificationsRepository.markAllRead(userId);
  }

  /**
   * notify — Crea una notificación para un usuario específico.
   */
  async notify(data: {
    userId: number;
    type: NotificationType;
    title: string;
    body: string;
    entityId?: number;
    entityType?: string;
  }) {
    return this.notificationsRepository.create(data);
  }

  /**
   * notifyAdmins — Crea una notificación para todos los admins y super_admins.
   */
  async notifyAdmins(data: {
    type: NotificationType;
    title: string;
    body: string;
    entityId?: number;
    entityType?: string;
  }) {
    const adminIds = await this.notificationsRepository.findAdminUserIds();
    await Promise.all(
      adminIds.map((userId) =>
        this.notificationsRepository.create({ ...data, userId }),
      ),
    );
  }
}
