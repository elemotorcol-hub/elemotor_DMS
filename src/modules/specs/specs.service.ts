import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SpecsRepository, SPEC_LIST_SELECT } from './specs.repository';
import { CreateSpecDto } from './dto/create-spec.dto';
import { UpdateSpecDto } from './dto/update-spec.dto';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';

export type SpecListResponse = Prisma.SpecGetPayload<{
  select: typeof SPEC_LIST_SELECT;
}>;

/**
 * SpecsService
 * Capa de lógica de negocio para Specs (relación 1:1 con Trim).
 * Valida existencia del trim y unicidad de la spec usando el repositorio.
 */
@Injectable()
export class SpecsService {
  constructor(private readonly specsRepository: SpecsRepository) {}

  async create(dto: CreateSpecDto) {
    // 1. Validar que el trim exista
    await this.assertTrimExists(dto.trimId);

    // 2. Validar que no exista ya una spec para ese trim (relación 1:1 explícita)
    const existingSpec = await this.specsRepository.checkExistsByTrim(dto.trimId);
    if (existingSpec) {
      throw new ConflictException(
        `Trim #${dto.trimId} already has a spec (Spec #${existingSpec.id}). Use PATCH /specs/${existingSpec.id} to update it.`,
      );
    }

    try {
      return await this.specsRepository.create(dto);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException(
            `Foreign key constraint failed. Check that trimId "${dto.trimId}" exists.`,
          );
        }
      }
      throw error;
    }
  }

  async findAll(query: PaginationDto): Promise<PaginatedResult<SpecListResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [data, total] = await Promise.all([
      this.specsRepository.findMany(query),
      this.specsRepository.count(),
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
    const spec = await this.specsRepository.findById(id);
    if (!spec) {
      throw new NotFoundException(`Spec #${id} not found`);
    }
    return spec;
  }

  async findByTrim(trimId: number) {
    const spec = await this.specsRepository.findByTrim(trimId);
    if (!spec) {
      throw new NotFoundException(`Spec for trim #${trimId} not found`);
    }
    return spec;
  }

  async update(id: number, dto: UpdateSpecDto) {
    // Verificar existencia del spec antes de actualizar
    const existing = await this.specsRepository.checkExists(id);
    if (!existing) {
      throw new NotFoundException(`Spec #${id} not found`);
    }

    return this.specsRepository.update(id, dto);
  }

  async remove(id: number) {
    // Verificar existencia antes de eliminar
    const existing = await this.specsRepository.checkExists(id);
    if (!existing) {
      throw new NotFoundException(`Spec #${id} not found`);
    }

    return this.specsRepository.remove(id);
  }

  /** Verifica que el trim exista; lanza BadRequestException si no. */
  private async assertTrimExists(trimId: number): Promise<void> {
    const trim = await this.specsRepository.findTrimById(trimId);
    if (!trim) {
      throw new BadRequestException(
        `Trim #${trimId} does not exist. Provide a valid trimId.`,
      );
    }
  }
}
