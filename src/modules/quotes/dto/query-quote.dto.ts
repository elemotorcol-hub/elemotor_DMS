import { IsOptional, IsEnum, IsInt, IsPositive, IsDateString, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { QuoteStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export const QUOTE_SORT_FIELDS = ['createdAt', 'updatedAt'] as const;
export type QuoteSortField = (typeof QUOTE_SORT_FIELDS)[number];

export const QUOTE_DIRECTIONS = ['asc', 'desc'] as const;
export type QuoteDirection = (typeof QUOTE_DIRECTIONS)[number];

/**
 * QueryQuoteDto — Admin filters, sorting and pagination for GET /api/quotes.
 */
export class QueryQuoteDto extends PaginationDto {
  @ApiPropertyOptional({ enum: QuoteStatus, description: 'Filtrar por estado de la cotización' })
  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;

  @ApiPropertyOptional({ example: 3, description: 'Filtrar por ID del asesor asignado' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  assignedToId?: number;

  @ApiPropertyOptional({ example: 'juan@elemotor.co', description: 'Filtrar por email del solicitante' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'web', description: 'Filtrar por fuente (source)' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Fecha de inicio del rango (created_at >= from)',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'Fecha de fin del rango (created_at <= to)',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    enum: QUOTE_SORT_FIELDS,
    default: 'createdAt',
    description: 'Campo de ordenamiento',
  })
  @IsOptional()
  @IsString()
  @IsIn(QUOTE_SORT_FIELDS)
  sortBy?: QuoteSortField = 'createdAt';

  @ApiPropertyOptional({
    enum: QUOTE_DIRECTIONS,
    default: 'desc',
    description: 'Dirección del ordenamiento',
  })
  @IsOptional()
  @IsString()
  @IsIn(QUOTE_DIRECTIONS)
  order?: QuoteDirection = 'desc';
}
