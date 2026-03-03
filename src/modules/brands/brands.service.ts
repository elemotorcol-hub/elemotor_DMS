import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BrandsRepository, BRAND_LIST_SELECT } from './brands.repository';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { QueryBrandDto } from './dto/query-brand.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

export type BrandListResponse = Prisma.BrandGetPayload<{
  select: typeof BRAND_LIST_SELECT;
}>;

/**
 * BrandsService
 * Capa de lógica de negocio. Valida reglas de dominio y delega
 * el acceso a datos al BrandsRepository (principio SRP + DIP).
 */
@Injectable()
export class BrandsService {
  constructor(private readonly brandsRepository: BrandsRepository) {}

  async create(dto: CreateBrandDto) {
    await this.assertSlugUnique(dto.slug);
    return this.brandsRepository.create(dto);
  }

  async findAll(
    query: QueryBrandDto,
  ): Promise<PaginatedResult<BrandListResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [data, total] = await Promise.all([
      this.brandsRepository.findMany(query),
      this.brandsRepository.count(query),
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
    const brand = await this.brandsRepository.findById(id);
    if (!brand) {
      throw new NotFoundException(`Brand #${id} not found or is inactive`);
    }
    return brand;
  }

  async update(id: number, dto: UpdateBrandDto) {
    // Verify the brand exists before attempting update
    const existing = await this.brandsRepository.findByIdAdmin(id);
    if (!existing) {
      throw new NotFoundException(`Brand #${id} not found`);
    }

    // Validate slug uniqueness if slug is being changed
    if (dto.slug && dto.slug !== existing.slug) {
      await this.assertSlugUnique(dto.slug);
    }

    return this.brandsRepository.update(id, dto);
  }

  /**
   * Soft delete — sets active = false.
   * Validates that no active models are linked before deactivating.
   */
  async remove(id: number) {
    const brand = await this.brandsRepository.findByIdAdmin(id);
    if (!brand) {
      throw new NotFoundException(`Brand #${id} not found`);
    }

    const activeModelsCount = await this.brandsRepository.countActiveModels(id);
    if (activeModelsCount > 0) {
      throw new ConflictException(
        `Brand #${id} has ${activeModelsCount} active model(s). Deactivate them first.`,
      );
    }

    return this.brandsRepository.softDelete(id);
  }

  /** Assert that a slug is not already taken (throws ConflictException). */
  private async assertSlugUnique(slug: string): Promise<void> {
    const conflict = await this.brandsRepository.findBySlug(slug);
    if (conflict) {
      throw new ConflictException(
        `Slug "${slug}" is already in use by Brand #${conflict.id}`,
      );
    }
  }
}
