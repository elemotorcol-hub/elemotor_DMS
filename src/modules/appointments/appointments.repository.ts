import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';

const WORKSHOP_SELECT = { id: true, name: true } satisfies Prisma.WorkshopSelect;

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAppointmentDto) {
    return this.prisma.appointment.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        workshopId: dto.workshopId ?? null,
        preferredDate: new Date(dto.preferredDate),
        preferredTime: dto.preferredTime ?? null,
        serviceType: dto.serviceType,
        notes: dto.notes ?? null,
        status: 'pending',
      },
      include: {
        workshop: {
          select: { id: true, name: true, address: true, city: true, email: true, phone: true },
        },
      },
    });
  }

  async findMany(filters: QueryAppointmentsDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.workshopId) where.workshopId = filters.workshopId;
    if (filters.dateFrom || filters.dateTo) {
      where.preferredDate = {
        ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
        ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { workshop: { select: WORKSHOP_SELECT } },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: number) {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: {
        workshop: {
          select: { id: true, name: true, address: true, city: true, phone: true, email: true },
        },
      },
    });
  }

  async updateStatus(id: number, status: string) {
    return this.prisma.appointment.update({
      where: { id },
      data: { status },
      include: { workshop: { select: WORKSHOP_SELECT } },
    });
  }

  async hardDelete(id: number) {
    return this.prisma.appointment.delete({ where: { id } });
  }
}
