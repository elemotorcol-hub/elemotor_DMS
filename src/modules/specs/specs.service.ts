import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSpecDto } from './dto/create-spec.dto';
import { UpdateSpecDto } from './dto/update-spec.dto';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';

@Injectable()
export class SpecsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSpecDto) {
    try {
      return await this.prisma.spec.create({ data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `A spec for trim #${dto.trimId} already exists. Use PATCH to update it.`,
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
      this.prisma.spec.findMany({
        skip,
        take: limit,
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
      this.prisma.spec.count(),
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
    const spec = await this.prisma.spec.findUnique({
      where: { id },
      include: {
        trim: {
          include: {
            model: { include: { brand: true } },
          },
        },
      },
    });
    if (!spec) {
      throw new NotFoundException(`Spec #${id} not found`);
    }
    return spec;
  }

  async findByTrim(trimId: number) {
    const spec = await this.prisma.spec.findUnique({ where: { trimId } });
    if (!spec) {
      throw new NotFoundException(`Spec for trim #${trimId} not found`);
    }
    return spec;
  }

  async update(id: number, dto: UpdateSpecDto) {
    try {
      return await this.prisma.spec.update({ where: { id }, data: dto });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Spec #${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.spec.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Spec #${id} not found`);
      }
      throw error;
    }
  }
}
