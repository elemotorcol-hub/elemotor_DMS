import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';

@Injectable()
export class ColorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateColorDto) {
    try {
      return await this.prisma.color.create({ data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Color "${dto.name}" already exists for trim #${dto.trimId}`,
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            `Foreign key constraint failed. Check that trimId "${dto.trimId}" exists.`,
          );
        }
      }
      throw error;
    }
  }

  async findAll(query: PaginationDto): Promise<PaginatedResult<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.color.findMany({
        skip,
        take: limit,
        orderBy: [{ trimId: 'asc' }, { type: 'asc' }, { name: 'asc' }],
        include: {
          trim: {
            select: {
              id: true,
              name: true,
              model: { select: { id: true, name: true, year: true } },
            },
          },
        },
      }),
      this.prisma.color.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const color = await this.prisma.color.findUnique({
      where: { id },
      include: {
        trim: { include: { model: { include: { brand: true } } } },
      },
    });
    if (!color) {
      throw new NotFoundException(`Color #${id} not found`);
    }
    return color;
  }

  async findByTrim(trimId: number) {
    return this.prisma.color.findMany({
      where: { trimId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async update(id: number, dto: UpdateColorDto) {
    try {
      return await this.prisma.color.update({ where: { id }, data: dto });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Color #${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.color.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Color #${id} not found`);
      }
      throw error;
    }
  }
}
