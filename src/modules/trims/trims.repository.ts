import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTrimDto } from './dto/create-trim.dto';
import { UpdateTrimDto } from './dto/update-trim.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

/** Relación cargada por defecto al buscar trims en endpoints públicos */
export const TRIM_LIST_SELECT = {
  id: true,
  name: true,
  price: true,
  availableQuantity: true,
  status: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  modelId: true,
  model: {
    select: {
      id: true,
      name: true,
      slug: true,
      year: true,
      brand: { select: { id: true, name: true, slug: true } },
    },
  },
  _count: { select: { colors: true, images: true } },
} satisfies Prisma.TrimSelect;

@Injectable()
export class TrimsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    return this.prisma.trim.findMany({
      skip,
      take: limit,
      where: { active: true },
      orderBy: { price: 'asc' },
      select: TRIM_LIST_SELECT,
    });
  }

  async count(): Promise<number> {
    return this.prisma.trim.count({ where: { active: true } });
  }

  async findById(id: number) {
    return this.prisma.trim.findFirst({
      where: { id, active: true },
      include: {
        model: { include: { brand: true } },
        spec: true,
        colors: { orderBy: { type: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async findByIdAdmin(id: number) {
    return this.prisma.trim.findUnique({
      where: { id },
      select: { id: true, active: true },
    });
  }

  async findModelById(modelId: number) {
    return this.prisma.model.findUnique({
      where: { id: modelId },
      select: { id: true },
    });
  }

  async create(data: CreateTrimDto) {
    return this.prisma.trim.create({ data });
  }

  async update(id: number, data: UpdateTrimDto) {
    return this.prisma.trim.update({ where: { id }, data });
  }

  async softDelete(id: number) {
    return this.prisma.trim.update({
      where: { id },
      data: { active: false },
    });
  }

  /** Verifica si el trim tiene pedidos u órdenes vinculadas */
  async hasLinkedRecords(id: number): Promise<boolean> {
    const counts = await this.prisma.trim.findUnique({
      where: { id },
      select: { _count: { select: { orders: true, quotes: true } } },
    });
    if (!counts) return false;
    return counts._count.orders > 0 || counts._count.quotes > 0;
  }

  async hardDelete(id: number) {
    return this.prisma.$transaction(async (tx) => {
      await tx.image.deleteMany({ where: { trimId: id } });
      await tx.color.deleteMany({ where: { trimId: id } });
      await tx.spec.deleteMany({ where: { trimId: id } });
      await tx.model3d.deleteMany({ where: { trimId: id } });
      return tx.trim.delete({ where: { id } });
    });
  }
}
