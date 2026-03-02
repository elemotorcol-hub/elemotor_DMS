import {
  Injectable,
  NotFoundException,
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
 * Capa de lógica de negocio. Solo orquesta operaciones y lanza
 * excepciones de dominio; NO contiene queries de base de datos.
 */
@Injectable()
export class ModelsService {
  constructor(private readonly modelsRepository: ModelsRepository) {}

  async create(dto: CreateModelDto) {
    return await this.modelsRepository.create(dto);
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
      throw new NotFoundException(`Model #${id} not found`);
    }
    return model;
  }

  async update(id: number, dto: UpdateModelDto) {
    return await this.modelsRepository.update(id, dto);
  }

  async remove(id: number) {
    return await this.modelsRepository.delete(id);
  }
}
