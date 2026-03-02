import {
  IsOptional,
  IsString,
  IsBoolean,
  IsIn,
  IsInt,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ModelType } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export const MODEL_SORT_FIELDS = [
  'name',
  'year',
  'basePrice',
  'createdAt',
] as const;
export type ModelSortField = typeof MODEL_SORT_FIELDS[number];

export const ORDER_DIRECTIONS = ['asc', 'desc'] as const;
export type OrderDirection = typeof ORDER_DIRECTIONS[number];

/**
 * QueryModelDto
 * DTO para validar y transformar los query params del endpoint GET /api/models.
 * Extiende PaginationDto (page, limit) y agrega filtros + sorting.
 */
export class QueryModelDto extends PaginationDto {
  /** Filtrar por marca */
  @ApiPropertyOptional({
    description: 'Filtrar por ID de marca',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  brandId?: number;

  /** Búsqueda parcial por nombre del modelo */
  @ApiPropertyOptional({
    description: 'Filtrar por nombre (búsqueda parcial)',
    example: 'Atto',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  /** Filtrar por año */
  @ApiPropertyOptional({
    description: 'Filtrar por año del modelo',
    example: 2025,
  })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Type(() => Number)
  year?: number;

  /** Filtrar por tipo de carrocería */
  @ApiPropertyOptional({
    description: 'Filtrar por tipo de carrocería',
    enum: ModelType,
    example: ModelType.SUV,
  })
  @IsOptional()
  @IsEnum(ModelType)
  type?: ModelType;

  /** Filtrar modelos activos/inactivos */
  @ApiPropertyOptional({
    description: 'Filtrar por estado activo (true) o inactivo (false)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  active?: boolean;

  /** Filtrar modelos destacados */
  @ApiPropertyOptional({
    description: 'Filtrar solo modelos destacados',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  featured?: boolean;

  /** Campo de ordenamiento */
  @ApiPropertyOptional({
    description: 'Campo por el que ordenar',
    enum: MODEL_SORT_FIELDS,
    default: 'year',
  })
  @IsOptional()
  @IsString()
  @IsIn(MODEL_SORT_FIELDS)
  sortBy?: ModelSortField = 'year';

  /** Dirección del ordenamiento */
  @ApiPropertyOptional({
    description: 'Dirección del ordenamiento',
    enum: ORDER_DIRECTIONS,
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  @IsIn(ORDER_DIRECTIONS)
  order?: OrderDirection = 'desc';
}
