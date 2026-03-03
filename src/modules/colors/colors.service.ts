import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ColorsRepository, COLOR_LIST_SELECT } from './colors.repository';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';

export type ColorListResponse = Prisma.ColorGetPayload<{
  select: typeof COLOR_LIST_SELECT;
}>;

/**
 * ColorsService
 * Lógica de negocio para Colors.
 * - Utiliza ColorsRepository para manipulación de DB (SRP).
 * - Acepta hexCode como #RRGGBB y normaliza a 6 chars limpios.
 * - Valida existencia del trim antes de mutar.
 */
@Injectable()
export class ColorsService {
  constructor(private readonly colorsRepository: ColorsRepository) {}

  async create(dto: CreateColorDto) {
    await this.assertTrimExists(dto.trimId);

    const data = {
      ...dto,
      hexCode: this.normalizeHexString(dto.hexCode) as string,
    };

    try {
      return await this.colorsRepository.create(data);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Color "${dto.name}" already exists for trim #${dto.trimId}`,
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

  async findAll(query: PaginationDto): Promise<PaginatedResult<ColorListResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [data, total] = await Promise.all([
      this.colorsRepository.findMany(query),
      this.colorsRepository.count(),
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
    const color = await this.colorsRepository.findById(id);
    if (!color) {
      throw new NotFoundException(`Color #${id} not found`);
    }
    return color;
  }

  async findByTrim(trimId: number) {
    return this.colorsRepository.findByTrim(trimId);
  }

  async update(id: number, dto: UpdateColorDto) {
    const existing = await this.colorsRepository.checkExists(id);
    if (!existing) {
      throw new NotFoundException(`Color #${id} not found`);
    }

    const data = {
      ...dto,
      ...(dto.hexCode && { hexCode: this.normalizeHexString(dto.hexCode) }),
    };

    return this.colorsRepository.update(id, data);
  }

  async remove(id: number) {
    const existing = await this.colorsRepository.checkExists(id);
    if (!existing) {
      throw new NotFoundException(`Color #${id} not found`);
    }

    return this.colorsRepository.remove(id);
  }

  /**
   * normalizeHexString — Pura, devuelve el hex code validado y limpio 
   * (le quita el `#` si existe). No clona DTOs.
   */
  private normalizeHexString(hexCode?: string): string | undefined {
    if (hexCode?.startsWith('#')) {
      return hexCode.slice(1).toUpperCase();
    }
    return hexCode;
  }

  private async assertTrimExists(trimId: number): Promise<void> {
    const trim = await this.colorsRepository.findTrimById(trimId);
    if (!trim) {
      throw new BadRequestException(
        `Trim #${trimId} does not exist. Provide a valid trimId.`,
      );
    }
  }
}
