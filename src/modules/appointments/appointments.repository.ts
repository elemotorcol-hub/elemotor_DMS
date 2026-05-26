import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

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
}
