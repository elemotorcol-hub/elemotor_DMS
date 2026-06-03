import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TrimsRepository, TRIM_LIST_SELECT } from './trims.repository';
import { CreateTrimDto } from './dto/create-trim.dto';
import { UpdateTrimDto } from './dto/update-trim.dto';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';

export type TrimListResponse = Prisma.TrimGetPayload<{
  select: typeof TRIM_LIST_SELECT;
}>;

/**
 * TrimsService
 * Capa de lógica de negocio para Trims.
 * Delega el acceso a datos al TrimsRepository (SRP).
 */
@Injectable()
export class TrimsService {
  constructor(private readonly trimsRepository: TrimsRepository) {}

  async create(dto: CreateTrimDto) {
    await this.assertModelExists(dto.modelId);

    try {
      return await this.trimsRepository.create(dto);
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

  async findAll(query: PaginationDto): Promise<PaginatedResult<TrimListResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [data, total] = await Promise.all([
      this.trimsRepository.findMany(query),
      this.trimsRepository.count(),
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
    const trim = await this.trimsRepository.findById(id);
    if (!trim) {
      throw new NotFoundException(`Trim #${id} not found or is inactive`);
    }
    return trim;
  }

  async update(id: number, dto: UpdateTrimDto) {
    await this.assertTrimExists(id);

    if (dto.modelId !== undefined) {
      await this.assertModelExists(dto.modelId);
    }

    try {
      return await this.trimsRepository.update(id, dto);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          `Foreign key constraint failed. Check that modelId exists.`,
        );
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.assertTrimExists(id);
    return this.trimsRepository.softDelete(id);
  }

  /**
   * hardRemove — intenta eliminación física.
   * Si el trim tiene pedidos u órdenes vinculadas, hace fallback a soft-delete
   * para preservar la integridad del historial y devuelve un flag informativo.
   */
  async hardRemove(id: number) {
    await this.assertTrimExists(id);

    const hasLinked = await this.trimsRepository.hasLinkedRecords(id);
    if (hasLinked) {
      await this.trimsRepository.softDelete(id);
      return { deleted: false, deactivated: true, id };
    }

    return this.trimsRepository.hardDelete(id);
  }

  private async assertTrimExists(id: number): Promise<void> {
    const trim = await this.trimsRepository.findByIdAdmin(id);
    if (!trim) {
      throw new NotFoundException(`Trim #${id} not found`);
    }
  }

  private async assertModelExists(modelId: number): Promise<void> {
    const model = await this.trimsRepository.findModelById(modelId);
    if (!model) {
      throw new BadRequestException(
        `Model #${modelId} does not exist. Provide a valid modelId.`,
      );
    }
  }
}
