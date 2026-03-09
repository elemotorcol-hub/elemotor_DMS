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
 * Capa de acceso a datos. Centraliza todas las queries Prisma.
 * El servicio NO accede directamente a PrismaService (DIP + SRP).
 */
@Injectable()
export class BrandsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Construye el objeto `where` a partir de los filtros del DTO */
  private buildWhere(filters: QueryBrandDto): Prisma.BrandWhereInput {
    const where: Prisma.BrandWhereInput = {};

    if (filters.name) {
      where.name = { contains: filters.name };
    }

    if (filters.active !== undefined) {
      where.active = filters.active;
    }
    // removed default where.active = true to allow fetching all records in the admin panel if no filter is provided.

    return where;
  }

  /**
   * findMany — Lista paginada. Fuerza active=true para endpoints públicos
   * salvo que el filtro lo indique explícitamente.
   */
  async findMany(filters: QueryBrandDto) {
    const page = filters.page ?? 1;
    // Removido el limite estricto para que la tabla admin traiga todos por defecto si no se le pasa limit.
    const limit = filters.limit ?? 1000; 
    const skip = (page - 1) * limit;
    const where = this.buildWhere(filters);
    const sortBy = filters.sortBy ?? 'createdAt'; // Changed to createdAt to see newest
    const order = filters.order ?? 'desc';

    return this.prisma.brand.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
      select: BRAND_LIST_SELECT,
    });
  }

  /** count — Total que coinciden con los filtros */
  async count(filters: QueryBrandDto): Promise<number> {
    return this.prisma.brand.count({ where: this.buildWhere(filters) });
  }

  /**
   * findById — Detalle público. Solo retorna marca activa con modelos activos.
   * Devuelve null si no existe o está inactiva.
   */
  async findById(id: number) {
    return this.prisma.brand.findFirst({
      where: { id, active: true },
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

  /**
   * findByIdAdmin — Acceso admin: retorna la marca sin filtrar por active.
   * Usado en update() y remove() para verificar existencia.
   */
  async findByIdAdmin(id: number) {
    return this.prisma.brand.findUnique({
      where: { id },
      select: { id: true, slug: true, active: true },
    });
  }

  /** findBySlug — Busca por slug (para validar unicidad). */
  async findBySlug(slug: string) {
    return this.prisma.brand.findUnique({
      where: { slug },
      select: { id: true },
    });
  }

  /** countActiveModels — Cuenta modelos activos de la marca (integridad referencial). */
  async countActiveModels(brandId: number): Promise<number> {
    return this.prisma.model.count({ where: { brandId, active: true } });
  }

  /** create */
  async create(data: CreateBrandDto) {
    return this.prisma.brand.create({ data });
  }

  /** update */
  async update(id: number, data: UpdateBrandDto) {
    return this.prisma.brand.update({ where: { id }, data });
  }

  /** softDelete — Establece active = false (sin eliminación física). */
  async softDelete(id: number) {
    return this.prisma.brand.update({
      where: { id },
      data: { active: false },
    });
  }
}
