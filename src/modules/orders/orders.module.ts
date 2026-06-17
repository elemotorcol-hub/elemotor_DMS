import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { OrdersWebhookService } from './webhook/orders-webhook.service';
import { QuotesModule } from '../quotes/quotes.module';
import { UploadModule } from '../upload/upload.module';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * OrdersModule — Gestión de pedidos de importación.
 *
 * Expone 6 endpoints bajo /api/orders:
 *  - POST   /orders              (admin)  Crear pedido
 *  - GET    /orders              (admin)  Listar con filtros y paginación
 *  - PUT    /orders/:id          (admin)  Editar VIN / notas / fecha
 *  - PUT    /orders/:id/status   (admin)  Cambiar estado + historial + webhook
 *  - GET    /orders/my           (client) Mis pedidos
 *  - GET    /orders/my/:id       (client) Detalle + historial completo
 *
 * PrismaModule es global → no es necesario importarlo aquí.
 * ConfigModule es global → OrdersWebhookService puede inyectar ConfigService.
 */
@Module({
  imports: [forwardRef(() => QuotesModule), UploadModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository, OrdersWebhookService],
  exports: [OrdersRepository],
})
export class OrdersModule {}
