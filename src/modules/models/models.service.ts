import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ModelsRepository, MODEL_LIST_SELECT } from './models.repository';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { QueryModelDto } from './dto/query-model.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

export type ModelListResponse = Prisma.ModelGetPayload<{
  select: typeof MODEL_LIST_SELECT;
}>;

/**
 * ModelsService
 * Capa de lógica de negocio. Valida reglas de dominio y delega
 * el acceso a datos al ModelsRepository (SRP + DIP).
 */
@Injectable()
export class ModelsService {
  constructor(private readonly modelsRepository: ModelsRepository) {}

  async create(dto: CreateModelDto) {
    await this.assertBrandExists(dto.brandId);
    await this.assertSlugUnique(dto.slug);
    return this.modelsRepository.create(dto);
  }

  async findAll(
    query: QueryModelDto,
  ): Promise<PaginatedResult<ModelListResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [data, total] = await Promise.all([
      this.modelsRepository.findMany(query),
      this.modelsRepository.count(query),
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
    const model = await this.modelsRepository.findById(id);
    if (!model) {
      throw new NotFoundException(`Model #${id} not found or is inactive`);
    }
    return model;
  }

  async findBySlug(slug: string) {
    const model = await this.modelsRepository.findBySlugPublic(slug);
    if (!model) {
      throw new NotFoundException(`Model with slug "${slug}" not found or is inactive`);
    }
    return model;
  }

  async findOneAdmin(id: number) {
    const model = await this.modelsRepository.findByIdAdminFull(id);
    if (!model) {
      throw new NotFoundException(`Model #${id} not found`);
    }
    return model;
  }

  async update(id: number, dto: UpdateModelDto) {
    // Verify model exists (regardless of active status)
    const existing = await this.modelsRepository.findByIdAdmin(id);
    if (!existing) {
      throw new NotFoundException(`Model #${id} not found`);
    }

    // Validate brandId if it is being changed
    if (dto.brandId !== undefined) {
      await this.assertBrandExists(dto.brandId);
    }

    // Validate slug uniqueness if it is being changed
    if (dto.slug && dto.slug !== existing.slug) {
      await this.assertSlugUnique(dto.slug);
    }

    return this.modelsRepository.update(id, dto);
  }

  /**
   * Soft delete — sets active = false on the model and all its trims.
   */
  async remove(id: number) {
    const model = await this.modelsRepository.findByIdAdmin(id);
    if (!model) {
      throw new NotFoundException(`Model #${id} not found`);
    }
    return this.modelsRepository.softDeleteWithTrims(id);
  }

  /** Hard delete — eliminación física irreversible. Cascada manual a trims y sus relaciones. */
  async hardRemove(id: number) {
    const model = await this.modelsRepository.findByIdAdmin(id);
    if (!model) {
      throw new NotFoundException(`Model #${id} not found`);
    }
    try {
      return await this.modelsRepository.hardDelete(id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          `No se puede eliminar el modelo #${id} porque algunas de sus versiones tienen órdenes o cotizaciones vinculadas. Desactívalo en su lugar.`,
        );
      }
      throw error;
    }
  }

  /** Assert that a brand exists; throws BadRequestException otherwise. */
  private async assertBrandExists(brandId: number): Promise<void> {
    const brand = await this.modelsRepository.findBrandById(brandId);
    if (!brand) {
      throw new BadRequestException(
        `Brand #${brandId} does not exist. Provide a valid brandId.`,
      );
    }
  }

  /** Assert that a slug is not already taken; throws ConflictException. */
  private async assertSlugUnique(slug: string): Promise<void> {
    const conflict = await this.modelsRepository.findBySlugForValidation(slug);
    if (conflict) {
      throw new ConflictException(
        `Slug "${slug}" is already in use by Model #${conflict.id}`,
      );
    }
  }
}
