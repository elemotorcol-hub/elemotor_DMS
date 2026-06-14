import { Injectable } from '@nestjs/common';
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
}
