import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTrimDto } from './dto/create-trim.dto';
import { UpdateTrimDto } from './dto/update-trim.dto';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';

@Injectable()
export class TrimsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTrimDto) {
    try {
      return await this.prisma.trim.create({ data: dto });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          `Foreign key constraint failed. Check that modelId "${dto.modelId}" exists.`,
        );
      }
      throw error;
    }
  }

  async findAll(query: PaginationDto): Promise<PaginatedResult<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.trim.findMany({
        skip,
        take: limit,
        orderBy: { price: 'asc' },
        include: {
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
        },
      }),
      this.prisma.trim.count(),
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
    const trim = await this.prisma.trim.findUnique({
      where: { id },
      include: {
        model: {
          include: {
            brand: true,
          },
        },
        spec: true,
        colors: { orderBy: { type: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!trim) {
      throw new NotFoundException(`Trim #${id} not found`);
    }
    return trim;
  }

  async update(id: number, dto: UpdateTrimDto) {
    try {
      return await this.prisma.trim.update({ where: { id }, data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Trim #${id} not found`);
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            `Foreign key constraint failed. Check references.`,
          );
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.trim.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Trim #${id} not found`);
      }
      throw error;
    }
  }
}
