import { IsOptional, IsString, IsBoolean, IsIn, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export const BRAND_SORT_FIELDS = ['name', 'country', 'createdAt'] as const;
export type BrandSortField = typeof BRAND_SORT_FIELDS[number];

export const ORDER_DIRECTIONS = ['asc', 'desc'] as const;
export type OrderDirection = typeof ORDER_DIRECTIONS[number];

/**
 * QueryBrandDto
 * DTO para validar y transformar los query params del endpoint GET /api/brands.
 * Extiende PaginationDto (page, limit) y agrega filtros + sorting.
 */
export class QueryBrandDto extends PaginationDto {
  /** Búsqueda parcial por nombre (LIKE '%name%', case-insensitive) */
  @ApiPropertyOptional({
    description: 'Filtrar por nombre (búsqueda parcial)',
    example: 'BYD',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  /** Filtrar por estado activo/inactivo */
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

  /** Campo de ordenamiento */
  @ApiPropertyOptional({
    description: 'Campo por el que ordenar',
    enum: BRAND_SORT_FIELDS,
    default: 'name',
  })
  @IsOptional()
  @IsString()
  @IsIn(BRAND_SORT_FIELDS)
  sortBy?: BrandSortField = 'name';

  /** Dirección del ordenamiento */
  @ApiPropertyOptional({
    description: 'Dirección del ordenamiento',
    enum: ORDER_DIRECTIONS,
    default: 'asc',
  })
  @IsOptional()
  @IsString()
  @IsIn(ORDER_DIRECTIONS)
  order?: OrderDirection = 'asc';
}
