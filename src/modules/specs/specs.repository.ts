import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSpecDto } from './dto/create-spec.dto';
import { UpdateSpecDto } from './dto/update-spec.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

/** Relación cargada por defecto al listar specs */
export const SPEC_LIST_SELECT = {
  id: true,
  trimId: true,
  batteryKwh: true,
  rangeCltcKm: true,
  rangeWltpKm: true,
  horsepower: true,
  torque: true,
  zeroTo100: true,
  topSpeed: true,
  chargeTime3080: true,
  trunkLiters: true,
  lengthMm: true,
  widthMm: true,
  heightMm: true,
  wheelbaseMm: true,
  curbWeightKg: true,
  softwareVersion: true,
  adasLevel: true,
  screenSize: true,
  kwhPer100km: true,
  trim: {
    select: {
      id: true,
      name: true,
      model: { select: { id: true, name: true, year: true } },
    },
  },
} satisfies Prisma.SpecSelect;

@Injectable()
export class SpecsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    return this.prisma.spec.findMany({
      skip,
      take: limit,
      select: SPEC_LIST_SELECT,
    });
  }

  async count(): Promise<number> {
    return this.prisma.spec.count();
  }

  async findById(id: number) {
    return this.prisma.spec.findUnique({
      where: { id },
      include: {
        trim: {
          include: {
            model: { include: { brand: true } },
          },
        },
      },
    });
  }

  async findByTrim(trimId: number) {
    return this.prisma.spec.findUnique({ where: { trimId } });
  }

  async findTrimById(trimId: number) {
    return this.prisma.trim.findUnique({
      where: { id: trimId },
      select: { id: true },
    });
  }

  async checkExists(id: number) {
    return this.prisma.spec.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  async checkExistsByTrim(trimId: number) {
    return this.prisma.spec.findUnique({
      where: { trimId },
      select: { id: true },
    });
  }

  async create(data: CreateSpecDto) {
    return this.prisma.spec.create({ data });
  }

  async update(id: number, data: UpdateSpecDto) {
    return this.prisma.spec.update({ where: { id }, data });
  }

  async remove(id: number) {
    return this.prisma.spec.delete({ where: { id } });
  }
}
