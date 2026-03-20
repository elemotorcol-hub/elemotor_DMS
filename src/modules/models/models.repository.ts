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
  // First active trim — provides specs and primary image for the public catalog card
  trims: {
    where: { active: true },
    orderBy: { price: 'asc' as const },
    take: 1,
    select: {
      id: true,
      name: true,
      price: true,
      status: true,
      spec: {
        select: {
          batteryKwh: true,
          rangeCltcKm: true,
          rangeWltpKm: true,
          horsepower: true,
          zeroTo100: true,
          topSpeed: true,
          chargeTime3080: true,
          trunkLiters: true,
          lengthMm: true,
          widthMm: true,
          heightMm: true,
          wheelbaseMm: true,
          adasLevel: true,
          kwhPer100km: true,
        },
      },
      images: {
        orderBy: { sortOrder: 'asc' as const },
        take: 1,
        select: {
          url: true,
          altText: true,
          type: true,
        },
      },
    },
  },
} satisfies Prisma.ModelSelect;

/**
 * ModelsRepository
 * Capa de acceso a datos para el modelo Model.
 * Centraliza todas las queries Prisma (DIP + SRP).
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
    // Removido el default.active = true para permitir que en el panel admin se listen todos si no se pasa nada

    if (filters.featured !== undefined) {
      where.featured = filters.featured;
    }

    return where;
  }

  /**
   * findMany — Lista de modelos con filtros, paginación y datos de marca.
   * Una sola query sin N+1 (brand incluido via select relacional).
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
   * findById — Detalle público (solo activos).
   * Incluye marca, trims activos con spec, colores e imágenes completos.
   */
  async findById(id: number) {
    return this.prisma.model.findFirst({
      where: { id, active: true },
      include: {
        brand: true,
        trims: {
          where: { active: true },
          orderBy: { price: 'asc' },
          include: {
            spec: true,
            colors: { orderBy: { type: 'asc' } },
            images: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });
  }

  /**
   * findBySlugPublic — Detalle público por slug (solo activos).
   * Mismo resultado que findById pero resolviendo por el campo único `slug`.
   * Usado por la página pública /modelos/[slug].
   */
  async findBySlugPublic(slug: string) {
    return this.prisma.model.findFirst({
      where: { slug, active: true },
      include: {
        brand: true,
        trims: {
          where: { active: true },
          orderBy: { price: 'asc' },
          include: {
            spec: true,
            colors: { orderBy: { type: 'asc' } },
            images: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });
  }

  /**
   * findByIdAdminFull — Detalle admin completo.
   * Incluye marca y todos los trims (activos e inactivos).
   */
  async findByIdAdminFull(id: number) {
    return this.prisma.model.findUnique({
      where: { id },
      include: {
        brand: true,
        trims: {
          orderBy: { price: 'asc' },
          include: {
            spec: true,
            _count: { select: { colors: true, images: true } },
          },
        },
      },
    });
  }

  /**
   * findByIdAdmin — Acceso admin: retorna el modelo sin filtrar por active.
   * Usado en update() y remove() para verificar existencia.
   */
  async findByIdAdmin(id: number) {
    return this.prisma.model.findUnique({
      where: { id },
      select: { id: true, slug: true, active: true },
    });
  }

  /** findBySlugForValidation — Busca por slug solo para validar unicidad en create/update. */
  async findBySlugForValidation(slug: string) {
    return this.prisma.model.findUnique({
      where: { slug },
      select: { id: true },
    });
  }

  /** findBrandById — Verifica existencia de la marca referenciada. */
  async findBrandById(brandId: number) {
    return this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true },
    });
  }

  /** countActiveTrims — Número de trims activos del modelo (integridad referencial). */
  async countActiveTrims(modelId: number): Promise<number> {
    return this.prisma.trim.count({ where: { modelId, active: true } });
  }

  /** create */
  async create(data: CreateModelDto) {
    return this.prisma.model.create({ data });
  }

  /** update */
  async update(id: number, data: UpdateModelDto) {
    return this.prisma.model.update({ where: { id }, data });
  }

  /** softDelete — Establece active = false (sin eliminación física). */
  async softDelete(id: number) {
    return this.prisma.model.update({
      where: { id },
      data: { active: false },
    });
  }
}
