import { Module, forwardRef } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { QuotesRepository } from './quotes.repository';
import { QuotesWebhookService } from './webhook/quotes-webhook.service';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * QuotesModule — Gestión de cotizaciones y leads.
 *
 * Exposes 6 endpoints under /api/quotes:
 *  - POST   /quotes           (public)  Crear cotización + webhook n8n
 *  - GET    /quotes/my        (client)  Mis cotizaciones paginadas
 *  - GET    /quotes/stats     (admin)   Métricas: hoy, por estado, por fuente
 *  - GET    /quotes           (admin)   Listar con filtros y paginación
 *  - GET    /quotes/:id       (admin)   Detalle completo con modelo
 *  - PUT    /quotes/:id       (admin)   Actualizar estado/asignación/notas
 *
 * PrismaModule and ConfigModule are global → no need to import them here.
 */
@Module({
  imports: [UsersModule, forwardRef(() => OrdersModule), MailModule, NotificationsModule],
  controllers: [QuotesController],
  providers: [QuotesService, QuotesRepository, QuotesWebhookService],
  exports: [QuotesRepository],
})
export class QuotesModule {}
