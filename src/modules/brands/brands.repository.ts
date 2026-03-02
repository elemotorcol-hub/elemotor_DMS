import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryBrandDto } from './dto/query-brand.dto';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

/** Campos seleccionados en la respuesta de lista de marcas */
export const BRAND_LIST_SELECT = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
  country: true,
  active: true,
  createdAt: true,
  _count: { select: { models: true } },
} satisfies Prisma.BrandSelect;

/**
 * BrandsRepository
 * Capa de acceso a datos para el modelo Brand.
 * Centraliza todas las queries Prisma; el servicio NO accede
 * directamente a PrismaService (principio DIP + SRP).
 */
@Injectable()
export class BrandsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Construye el objeto `where` a partir de los filtros del DTO */
  private buildWhere(filters: QueryBrandDto): Prisma.BrandWhereInput {
    const where: Prisma.BrandWhereInput = {};

    if (filters.name) {
      // MySQL is case-insensitive by default with utf8mb4_unicode_ci collation
      where.name = { contains: filters.name };
    }

    if (filters.active !== undefined) {
      where.active = filters.active;
    }

    return where;
  }

  /**
   * findMany — Lista de marcas con filtros, ordenamiento y paginación.
   * Query única, sin N+1: _count se resuelve en una sola consulta Prisma.
   */
  async findMany(filters: QueryBrandDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(filters);
    const sortBy = filters.sortBy ?? 'name';
    const order = filters.order ?? 'asc';

    return this.prisma.brand.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
      select: BRAND_LIST_SELECT,
    });
  }

  /** count — Total de registros que coinciden con los filtros */
  async count(filters: QueryBrandDto): Promise<number> {
    return this.prisma.brand.count({ where: this.buildWhere(filters) });
  }

  /**
   * findById — Detalle de marca con sus modelos activos.
   * Devuelve null si no existe (el servicio lanza NotFoundException).
   */
  async findById(id: number) {
    return this.prisma.brand.findUnique({
      where: { id },
      include: {
        models: {
          where: { active: true },
          orderBy: { year: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            year: true,
            basePrice: true,
            featured: true,
            active: true,
          },
        },
      },
    });
  }

  /** create */
  async create(data: CreateBrandDto) {
    return this.prisma.brand.create({ data });
  }

  /** update */
  async update(id: number, data: UpdateBrandDto) {
    return this.prisma.brand.update({ where: { id }, data });
  }

  /** delete */
  async delete(id: number) {
    return this.prisma.brand.delete({ where: { id } });
  }
}
