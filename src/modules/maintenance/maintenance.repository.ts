import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';

const MAINTENANCE_SELECT = {
  id: true,
  orderId: true,
  userId: true,
  date: true,
  type: true,
  rating: true,
  comment: true,
  cost: true,
  createdAt: true,
  workshop: {
    select: { id: true, name: true, city: true },
  },
} as const;

@Injectable()
export class MaintenanceRepository {
  private readonly logger = new Logger(MaintenanceRepository.name);
  
  constructor(private readonly prisma: PrismaService) {}

  /** Crea un nuevo registro de mantenimiento */
  async create(userId: number, dto: CreateMaintenanceDto) {
    return this.prisma.maintenanceRecord.create({
      data: {
        orderId: dto.orderId,
        userId,
        workshopId: dto.workshopId ?? null,
        date: new Date(dto.date),
        type: dto.type,
        rating: dto.rating ?? null,
        comment: dto.comment ?? null,
        cost: dto.cost ?? null,
      },
      select: MAINTENANCE_SELECT,
    });
  }

  /** Lista todos los registros de un usuario para un pedido, del más reciente al más antiguo */
  async findByUserAndOrder(userId: number, orderId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.maintenanceRecord.findMany({
        where: { userId, orderId },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        select: MAINTENANCE_SELECT,
      }),
      this.prisma.maintenanceRecord.count({
        where: { userId, orderId },
      }),
    ]);

    return { data, total };
  }

  /** Obtiene el registro más reciente de un usuario para un pedido */
  async findLatest(userId: number, orderId: number) {
    return this.prisma.maintenanceRecord.findFirst({
      where: { userId, orderId },
      orderBy: { date: 'desc' },
      select: MAINTENANCE_SELECT,
    });
  }

  /** Suma total de costos y conteo de registros para el resumen */
  async getSummary(userId: number, orderId: number) {
    const result = await this.prisma.maintenanceRecord.aggregate({
      where: { userId, orderId },
      _sum: { cost: true },
      _count: { id: true },
    });

    return {
      totalCost: Number(result._sum.cost ?? 0),
      totalRecords: result._count.id,
    };
  }

  /** Recalcula y actualiza el promedio de rating de un taller basado en el historial */
  async updateWorkshopRating(workshopId: number) {
    const agg = await this.prisma.maintenanceRecord.aggregate({
      where: { workshopId, rating: { not: null } },
      _avg: { rating: true },
    });

    // Prisma retorna null si no hay registros con rating
    const avgRating = agg._avg.rating;
    const finalRating = avgRating !== null ? Number(avgRating.toFixed(1)) : null;

    try {
      await this.prisma.workshop.update({
        where: { id: workshopId },
        data: { rating: finalRating },
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error al actualizar el rating del taller ${workshopId}: ${error.message}`, error.stack);
      } else {
        this.logger.error(`Error desconocido al actualizar el rating del taller ${workshopId}`, String(error));
      }
    }
  }
}
