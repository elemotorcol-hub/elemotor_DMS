import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { MaintenanceRepository } from './maintenance.repository';
import { OrdersRepository } from '../orders/orders.repository';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { QueryMaintenanceDto } from './dto/query-maintenance.dto';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    private readonly maintenanceRepository: MaintenanceRepository,
    private readonly ordersRepository: OrdersRepository,
  ) {}

  /**
   * createRecord — Valida que el pedido pertenece al usuario y está en estado "delivered"
   * antes de crear el registro de mantenimiento.
   */
  async createRecord(userId: number, dto: CreateMaintenanceDto) {
    const order = await this.ordersRepository.findByIdAndUserId(dto.orderId, userId);

    if (!order) {
      throw new NotFoundException(
        `Pedido #${dto.orderId} no encontrado o no pertenece a este usuario`,
      );
    }

    if (order.status !== OrderStatus.delivered) {
      throw new ForbiddenException(
        'Solo puedes registrar mantenimientos para vehículos entregados.',
      );
    }

    const record = await this.maintenanceRepository.create(userId, dto);

    // Actualizar agresivamente el rating del taller si fue proporcionado
    if (dto.workshopId && dto.rating !== undefined && dto.rating !== null) {
      // Fire-and-forget para no bloquear la respuesta
      this.maintenanceRepository
        .updateWorkshopRating(dto.workshopId)
        .catch((error) => {
          this.logger.error(`Error delegando la actualización del rating para el taller ${dto.workshopId}`, error instanceof Error ? error.stack : String(error));
        });
    }

    return record;
  }

  /**
   * findRecords — Retorna el historial de mantenimientos paginado.
   */
  async findRecords(userId: number, query: QueryMaintenanceDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { data, total } = await this.maintenanceRepository.findByUserAndOrder(
      userId,
      query.orderId,
      page,
      limit,
    );

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * getSummary — Retorna el total gastado y el número de registros.
   */
  async getSummary(userId: number, orderId: number) {
    return this.maintenanceRepository.getSummary(userId, orderId);
  }
}
