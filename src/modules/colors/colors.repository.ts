import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

/** Select relations when picking colors for public/admin grids */
export const COLOR_LIST_SELECT = {
  id: true,
  trimId: true,
  name: true,
  hexCode: true,
  type: true,
  imageUrl: true,
  swatchUrl: true,
  trim: {
    select: {
      id: true,
      name: true,
      model: { select: { id: true, name: true, year: true } },
    },
  },
} satisfies Prisma.ColorSelect;

@Injectable()
export class ColorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    return this.prisma.color.findMany({
      skip,
      take: limit,
      orderBy: [{ trimId: 'asc' }, { type: 'asc' }, { name: 'asc' }],
      select: COLOR_LIST_SELECT,
    });
  }

  async count(): Promise<number> {
    return this.prisma.color.count();
  }

  async findById(id: number) {
    return this.prisma.color.findUnique({
      where: { id },
      include: {
        trim: { include: { model: { include: { brand: true } } } },
      },
    });
  }

  async findByTrim(trimId: number) {
    return this.prisma.color.findMany({
      where: { trimId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async checkExists(id: number) {
    return this.prisma.color.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  async findTrimById(trimId: number) {
    return this.prisma.trim.findUnique({
      where: { id: trimId },
      select: { id: true },
    });
  }

  async create(data: CreateColorDto | Omit<CreateColorDto, 'hexCode'> & { hexCode: string }) {
    return this.prisma.color.create({ data: data as any });
  }

  async update(id: number, data: UpdateColorDto | Omit<UpdateColorDto, 'hexCode'> & { hexCode?: string }) {
    return this.prisma.color.update({ where: { id }, data: data as any });
  }

  async remove(id: number) {
    return this.prisma.color.delete({ where: { id } });
  }
}
