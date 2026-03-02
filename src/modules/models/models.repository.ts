import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryModelDto } from './dto/query-model.dto';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';

/** Campos seleccionados en la respuesta de lista de modelos */
export const MODEL_LIST_SELECT = {
  id: true,
  name: true,
  slug: true,
  type: true,
  year: true,
  basePrice: true,
  featured: true,
  active: true,
  createdAt: true,
  brand: {
    select: { id: true, name: true, slug: true, logoUrl: true },
  },
  _count: { select: { trims: true } },
} satisfies Prisma.ModelSelect;

/**
 * ModelsRepository
 * Capa de acceso a datos para el modelo Model.
 * Centraliza todas las queries Prisma; el servicio NO accede
 * directamente a PrismaService (principio DIP + SRP).
 */
@Injectable()
export class ModelsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Construye el objeto `where` a partir de los filtros del DTO */
  private buildWhere(filters: QueryModelDto): Prisma.ModelWhereInput {
    const where: Prisma.ModelWhereInput = {};

    if (filters.brandId !== undefined) {
      where.brandId = filters.brandId;
    }

    if (filters.name) {
      // MySQL is case-insensitive by default with utf8mb4_unicode_ci collation
      where.name = { contains: filters.name };
    }

    if (filters.year !== undefined) {
      where.year = filters.year;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.active !== undefined) {
      where.active = filters.active;
    }

    if (filters.featured !== undefined) {
      where.featured = filters.featured;
    }

    return where;
  }

  /**
   * findMany — Lista de modelos con filtros, ordenamiento y paginación.
   * Incluye datos mínimos de la marca en una sola query (sin N+1).
   */
  async findMany(filters: QueryModelDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(filters);
    const sortBy = filters.sortBy ?? 'year';
    const order = filters.order ?? 'desc';

    return this.prisma.model.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
      select: MODEL_LIST_SELECT,
    });
  }

  /** count — Total de registros que coinciden con los filtros */
  async count(filters: QueryModelDto): Promise<number> {
    return this.prisma.model.count({ where: this.buildWhere(filters) });
  }

  /**
   * findById — Detalle de modelo con marca y trims activos.
   * Devuelve null si no existe (el servicio lanza NotFoundException).
   */
  async findById(id: number) {
    return this.prisma.model.findUnique({
      where: { id },
      include: {
        brand: true,
        trims: {
          where: { active: true },
          orderBy: { price: 'asc' },
          include: {
            spec: true,
            _count: { select: { colors: true, images: true } },
          },
        },
      },
    });
  }

  /** create */
  async create(data: CreateModelDto) {
    return this.prisma.model.create({ data });
  }

  /** update */
  async update(id: number, data: UpdateModelDto) {
    return this.prisma.model.update({ where: { id }, data });
  }

  /** delete */
  async delete(id: number) {
    return this.prisma.model.delete({ where: { id } });
  }
}
