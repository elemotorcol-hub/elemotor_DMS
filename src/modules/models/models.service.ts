import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';

@Injectable()
export class ModelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateModelDto) {
    try {
      return await this.prisma.model.create({ data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Model with slug "${dto.slug}" already exists`,
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            `Foreign key constraint failed. Check that brandId "${dto.brandId}" exists.`,
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
      this.prisma.model.findMany({
        skip,
        take: limit,
        orderBy: [{ year: 'desc' }, { name: 'asc' }],
        include: {
          brand: {
            select: { id: true, name: true, slug: true, logoUrl: true },
          },
          _count: { select: { trims: true } },
        },
      }),
      this.prisma.model.count(),
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
    const model = await this.prisma.model.findUnique({
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
    if (!model) {
      throw new NotFoundException(`Model #${id} not found`);
    }
    return model;
  }

  async update(id: number, dto: UpdateModelDto) {
    try {
      return await this.prisma.model.update({ where: { id }, data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Model #${id} not found`);
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            `Foreign key constraint failed. Check that the provided references exist.`,
          );
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.model.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Model #${id} not found`);
      }
      throw error;
    }
  }
}
