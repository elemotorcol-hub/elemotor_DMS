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
  segment: true,
  year: true,
  basePrice: true,
  featured: true,
  active: true,
  createdAt: true,
  datasheetUrl: true,
  brand: {
    select: { id: true, name: true, slug: true, logoUrl: true },
  },
  _count: { select: { trims: true } },
  // Active trims — provides specs, primary image and colors for catalog/quote
  trims: {
    where: { active: true },
    orderBy: { price: 'asc' as const },
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
      colors: {
        where: { type: 'exterior' },
        orderBy: { name: 'asc' as const },
        select: {
          id: true,
          name: true,
          hexCode: true,
          type: true,
        },
      },
      models3d: {
        select: { id: true },
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

    if (filters.segment) {
      where.segment = filters.segment;
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
            models3d: { select: { id: true } },
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

  /** create — Usa inserción anidada (Nested Writes) nativa de Prisma para evitar N+1 */
  async create(data: CreateModelDto) {
    const { brandId, trims, ...modelData } = data;

    const createInput: Prisma.ModelCreateInput = {
      ...modelData,
      brand: { connect: { id: brandId } },
    };

    if (trims && trims.length > 0) {
      createInput.trims = {
        create: trims.map((t) => {
          const trimInput: Prisma.TrimCreateWithoutModelInput = {
            name: t.name,
            price: t.price,
            availableQuantity: t.available_quantity ?? 0,
            status: t.status,
            active: t.active ?? true,
          };

          if (t.specs && Object.keys(t.specs).length > 0) {
            trimInput.spec = { create: { ...t.specs } };
          }
          if (t.colors && t.colors.length > 0) {
            trimInput.colors = {
              create: t.colors.map(c => ({
                name: c.name,
                hexCode: c.hex_code,
                type: c.type,
                imageUrl: c.image_url,
                swatchUrl: c.swatch_url,
              })),
            };
          }
          if (t.images && t.images.length > 0) {
            trimInput.images = {
              create: t.images.map(img => ({
                url: img.url,
                publicId: img.publicId,
                altText: img.alt_text,
                type: img.type,
                sortOrder: img.sort_order ?? 0,
              })),
            };
          }
          if (t.model_3d) {
            trimInput.models3d = {
              create: {
                fileUrl: t.model_3d.file_url,
                publicId: t.model_3d.publicId,
                fileSizeMb: t.model_3d.file_size_mb,
                format: t.model_3d.format,
                dracoCompressed: t.model_3d.draco_compressed ?? true,
                lodLevel: t.model_3d.lod_level,
              },
            };
          }
          return trimInput;
        }),
      };
    }

    return this.prisma.model.create({ data: createInput });
  }

  /** update — Resolución profunda con $transaction */
  async update(id: number, data: UpdateModelDto) {
    return this.prisma.$transaction(async (tx) => {
      const { brandId, trims, ...modelData } = data;
      
      const model = await tx.model.update({
        where: { id },
        data: {
          ...modelData,
          ...(brandId !== undefined && { brand: { connect: { id: brandId } } }),
        },
      });

      if (!trims) return model;

      for (const t of trims) {
        if (t.dbId && t._deleted) {
          // Soft-delete o Hard-delete del trim. Asumimos hard-delete en cascada manual (limpiamos relaciones primero)
          await tx.image.deleteMany({ where: { trimId: t.dbId } });
          await tx.color.deleteMany({ where: { trimId: t.dbId } });
          await tx.spec.deleteMany({ where: { trimId: t.dbId } });
          await tx.model3d.deleteMany({ where: { trimId: t.dbId } });
          await tx.trim.delete({ where: { id: t.dbId } });
          continue;
        }

        let trimId = t.dbId;

        if (!trimId) {
          // Crear un Trim nuevo dentro de un Update (One-Shot)
          const newTrim = await tx.trim.create({
            data: {
              modelId: id,
              name: t.name,
              price: t.price,
              availableQuantity: t.available_quantity ?? 0,
              status: t.status,
              active: t.active ?? true,
            },
          });
          trimId = newTrim.id;
        } else {
          // Actualizar trim existente
          await tx.trim.update({
            where: { id: trimId },
            data: {
              name: t.name,
              price: t.price,
              availableQuantity: t.available_quantity,
              status: t.status,
              active: t.active,
            },
          });
        }

        // --- Manejo de Specs ---
        if (t.specs && Object.keys(t.specs).length > 0) {
          const { dbId: specDbId, ...specData } = t.specs;
          await tx.spec.upsert({
            where: { trimId },
            create: { trimId, ...specData },
            update: { ...specData },
          });
        }

        // --- Manejo de Colores ---
        if (t.colors) {
          for (const c of t.colors) {
            if (c.dbId && c._deleted) {
              await tx.color.delete({ where: { id: c.dbId } });
            } else if (!c.dbId) {
              await tx.color.create({
                data: { trimId, name: c.name, hexCode: c.hex_code, type: c.type, imageUrl: c.image_url, swatchUrl: c.swatch_url },
              });
            } else {
              await tx.color.update({
                where: { id: c.dbId },
                data: { name: c.name, hexCode: c.hex_code, type: c.type, imageUrl: c.image_url, swatchUrl: c.swatch_url },
              });
            }
          }
        }

        // --- Manejo de Imágenes ---
        if (t.images) {
          for (const img of t.images) {
            if (img.dbId && img._deleted) {
              await tx.image.delete({ where: { id: img.dbId } });
            } else if (!img.dbId) {
              await tx.image.create({
                data: { trimId, url: img.url, publicId: img.publicId, altText: img.alt_text, type: img.type, sortOrder: img.sort_order ?? 0 },
              });
            } else {
              await tx.image.update({
                where: { id: img.dbId },
                data: { url: img.url, publicId: img.publicId, altText: img.alt_text, type: img.type, sortOrder: img.sort_order },
              });
            }
          }
        }

        // --- Manejo del Modelo 3D ---
        if (t.model_3d) {
          if (t.model_3d.dbId && t.model_3d._deleted) {
            await tx.model3d.delete({ where: { id: t.model_3d.dbId } });
          } else if (!t.model_3d.dbId) {
            await tx.model3d.create({
              data: { trimId, fileUrl: t.model_3d.file_url, publicId: t.model_3d.publicId, format: t.model_3d.format, dracoCompressed: t.model_3d.draco_compressed ?? true, lodLevel: t.model_3d.lod_level },
            });
          } else {
            await tx.model3d.update({
              where: { id: t.model_3d.dbId },
              data: { fileUrl: t.model_3d.file_url, publicId: t.model_3d.publicId, format: t.model_3d.format, dracoCompressed: t.model_3d.draco_compressed, lodLevel: t.model_3d.lod_level },
            });
          }
        }
      }

      return model;
    });
  }

  /** softDelete — Establece active = false (sin eliminación física). */
  async softDelete(id: number) {
    return this.prisma.model.update({
      where: { id },
      data: { active: false },
    });
  }

  /**
   * softDeleteWithTrims — Desactiva el modelo y todas sus versiones en una sola transacción.
   * No elimina ningún registro físicamente; es seguro aunque haya órdenes/cotizaciones.
   */
  async softDeleteWithTrims(id: number) {
    return this.prisma.$transaction(async (tx) => {
      await tx.trim.updateMany({ where: { modelId: id }, data: { active: false } });
      return tx.model.update({ where: { id }, data: { active: false } });
    });
  }

  /** Retorna true si algún trim del modelo tiene órdenes o cotizaciones vinculadas */
  async hasTrimsWithLinkedRecords(id: number): Promise<boolean> {
    const count = await this.prisma.trim.count({
      where: {
        modelId: id,
        OR: [
          { orders: { some: {} } },
          { quotes: { some: {} } },
        ],
      },
    });
    return count > 0;
  }

  /**
   * hardDelete — Eliminación física irreversible.
   * Elimina todas las relaciones hijo de cada trim (imágenes, colores, spec, modelo3d)
   * antes de eliminar los trims y el modelo.
   */
  async hardDelete(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const trimIds = (
        await tx.trim.findMany({ where: { modelId: id }, select: { id: true } })
      ).map((t) => t.id);

      if (trimIds.length > 0) {
        await tx.image.deleteMany({ where: { trimId: { in: trimIds } } });
        await tx.color.deleteMany({ where: { trimId: { in: trimIds } } });
        await tx.spec.deleteMany({ where: { trimId: { in: trimIds } } });
        await tx.model3d.deleteMany({ where: { trimId: { in: trimIds } } });
        await tx.trim.deleteMany({ where: { id: { in: trimIds } } });
      }

      return tx.model.delete({ where: { id } });
    });
  }
}
