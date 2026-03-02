import {
  Injectable,
  NotFoundException,
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
 * Capa de lógica de negocio. Solo orquesta operaciones y lanza
 * excepciones de dominio; NO contiene queries de base de datos.
 */
@Injectable()
export class BrandsService {
  constructor(private readonly brandsRepository: BrandsRepository) {}

  async create(dto: CreateBrandDto) {
    return await this.brandsRepository.create(dto);
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
      throw new NotFoundException(`Brand #${id} not found`);
    }
    return brand;
  }

  async update(id: number, dto: UpdateBrandDto) {
    return await this.brandsRepository.update(id, dto);
  }

  async remove(id: number) {
    return await this.brandsRepository.delete(id);
  }
}
