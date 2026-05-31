import { Module } from '@nestjs/common';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceRepository } from './maintenance.repository';
import { OrdersModule } from '../orders/orders.module';

/**
 * MaintenanceModule — Registros de mantenimiento del cliente.
 *
 * Expone 3 endpoints bajo /api/maintenance:
 *  - POST   /maintenance           (client) Registrar mantenimiento realizado
 *  - GET    /maintenance           (client) Historial paginado por pedido
 *  - GET    /maintenance/summary   (client) Resumen de costos
 *
 * Importa OrdersModule para acceder a OrdersRepository (validar ownership y estado del pedido).
 */
@Module({
  imports: [OrdersModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceRepository],
})
export class MaintenanceModule {}
