import { Injectable } from '@nestjs/common';
import { Prisma, ServiceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { QueryWorkshopsDto } from './dto/query-workshops.dto';

@Injectable()
export class WorkshopsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkshopDto) {
    const { services, hours, images, ...data } = dto;
    
    return this.prisma.workshop.create({
      data: {
        ...data,
        services: services ? {
          create: services.map(type => ({ serviceType: type }))
        } : undefined,
        hours: hours ? {
          create: hours
        } : undefined,
        images: images ? {
          create: images.map(url => ({ url }))
        } : undefined
      },
      include: {
        services: true,
        hours: true,
        images: true
      }
    });
  }

  async findMany(filters: QueryWorkshopsDto) {
    const { city, service_type, lat, lng, radius, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    // Si hay búsqueda geográfica, usamos $queryRaw
    if (lat !== undefined && lng !== undefined && radius !== undefined) {
      // Haversine formula (6371 is Earth's radius in km)
      // MySQL uses radians. Decimal columns are cast to double.
      const workshops = await this.prisma.$queryRaw<any[]>`
        SELECT 
          w.*,
          (6371 * acos(
            cos(radians(${lat})) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(${lng})) + 
            sin(radians(${lat})) * sin(radians(latitude))
          )) AS distance
        FROM workshops w
        WHERE w.active = true
        ${city ? Prisma.sql`AND w.city = ${city}` : Prisma.empty}
        HAVING distance <= ${radius}
        ORDER BY distance ASC
        LIMIT ${limit} OFFSET ${skip}
      `;

      // Para los servicios y horas, necesitaremos hydrate o cargarlos por separado si es necesario
      // pero por ahora devolvemos el listado base.
      return workshops;
    }

    // Búsqueda estándar con Prisma
    const where: Prisma.WorkshopWhereInput = {
      active: true,
      city: city || undefined,
      services: service_type ? {
        some: { serviceType: service_type }
      } : undefined
    };

    return this.prisma.workshop.findMany({
      where,
      skip,
      take: limit,
      include: {
        services: true,
        hours: true,
        images: true
      },
      orderBy: { name: 'asc' }
    });
  }

  async count(filters: QueryWorkshopsDto): Promise<number> {
    const { city, service_type, lat, lng, radius } = filters;

    if (lat !== undefined && lng !== undefined && radius !== undefined) {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM (
          SELECT 
            (6371 * acos(
              cos(radians(${lat})) * cos(radians(latitude)) * 
              cos(radians(longitude) - radians(${lng})) + 
              sin(radians(${lat})) * sin(radians(latitude))
            )) AS distance
          FROM workshops
          WHERE active = true
          ${city ? Prisma.sql`AND city = ${city}` : Prisma.empty}
          HAVING distance <= ${radius}
        ) as sub
      `;
      return Number(result[0].count);
    }

    return this.prisma.workshop.count({
      where: {
        active: true,
        city: city || undefined,
        services: service_type ? {
          some: { serviceType: service_type }
        } : undefined
      }
    });
  }

  async findById(id: number) {
    return this.prisma.workshop.findUnique({
      where: { id },
      include: {
        services: true,
        hours: true,
        images: true
      }
    });
  }

  async update(id: number, dto: UpdateWorkshopDto) {
    const { services, hours, images, ...data } = dto;

    return this.prisma.$transaction(async (tx) => {
      // Si vienen servicios, limpiamos y recreamos (más simple que sync parcial)
      if (services) {
        await tx.workshopService.deleteMany({ where: { workshopId: id } });
      }
      
      // Si vienen horarios, lo mismo
      if (hours) {
        await tx.workshopHour.deleteMany({ where: { workshopId: id } });
      }

      // Si vienen imágenes, lo mismo (sync simple por ahora)
      if (images) {
        await tx.workshopImage.deleteMany({ where: { workshopId: id } });
      }

      return tx.workshop.update({
        where: { id },
        data: {
          ...data,
          services: services ? {
            create: services.map(type => ({ serviceType: type }))
          } : undefined,
          hours: hours ? {
            create: hours
          } : undefined,
          images: images ? {
            create: images.map(url => ({ url }))
          } : undefined
        },
        include: {
          services: true,
          hours: true,
          images: true
        }
      });
    });
  }

  async delete(id: number) {
    return this.prisma.workshop.update({
      where: { id },
      data: { active: false }
    });
  }

  // ─── Image relations ────────────────────────────────────────────────────────

  async createImage(workshopId: number, data: { url: string; publicId: string; altText?: string; sortOrder?: number }) {
    return this.prisma.workshopImage.create({
      data: {
        workshopId,
        ...data
      }
    });
  }

  async deleteImage(id: number) {
    return this.prisma.workshopImage.delete({ where: { id } });
  }

  async findImageById(id: number) {
    return this.prisma.workshopImage.findUnique({ where: { id } });
  }
}
