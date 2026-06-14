import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';

/**
 * NotificationsModule — Gestión de notificaciones internas de usuario.
 *
 * Endpoints bajo /api/notifications:
 *  - GET    /notifications              (auth)  Últimas 50 notificaciones
 *  - GET    /notifications/unread-count (auth)  Conteo de no leídas
 *  - PATCH  /notifications/:id/read    (auth)  Marcar una como leída
 *  - POST   /notifications/read-all    (auth)  Marcar todas como leídas
 *
 * PrismaModule es global, no necesita importarse aquí.
 */
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository],
  exports: [NotificationsService],
})
export class NotificationsModule {}
