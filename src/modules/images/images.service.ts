import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';

@Injectable()
export class ImagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateImageDto) {
    try {
      return await this.prisma.image.create({ data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Image with this URL already exists for trim #${dto.trimId}`,
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
      this.prisma.image.findMany({
        skip,
        take: limit,
        orderBy: [{ trimId: 'asc' }, { sortOrder: 'asc' }],
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
      this.prisma.image.count(),
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
    const image = await this.prisma.image.findUnique({
      where: { id },
      include: {
        trim: { include: { model: { include: { brand: true } } } },
      },
    });
    if (!image) {
      throw new NotFoundException(`Image #${id} not found`);
    }
    return image;
  }

  async findByTrim(trimId: number) {
    return this.prisma.image.findMany({
      where: { trimId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async update(id: number, dto: UpdateImageDto) {
    try {
      return await this.prisma.image.update({ where: { id }, data: dto });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Image #${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.image.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Image #${id} not found`);
      }
      throw error;
    }
  }
}
