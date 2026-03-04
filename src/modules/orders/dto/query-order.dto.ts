import {
  IsOptional,
  IsEnum,
  IsInt,
  IsPositive,
  IsDateString,
  IsIn,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export const ORDER_SORT_FIELDS = ['createdAt', 'estimatedDelivery'] as const;
export type OrderSortField = (typeof ORDER_SORT_FIELDS)[number];

export const ORDER_DIRECTIONS = ['asc', 'desc'] as const;
export type OrderDirection = (typeof ORDER_DIRECTIONS)[number];

/**
 * QueryOrderDto — Filtros, ordenamiento y paginación para GET /api/orders.
 */
export class QueryOrderDto extends PaginationDto {
  @ApiPropertyOptional({ enum: OrderStatus, description: 'Filtrar por estado del pedido' })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ example: 5, description: 'Filtrar por ID del usuario' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  userId?: number;

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
    enum: ORDER_SORT_FIELDS,
    default: 'createdAt',
    description: 'Campo de ordenamiento',
  })
  @IsOptional()
  @IsString()
  @IsIn(ORDER_SORT_FIELDS)
  sortBy?: OrderSortField = 'createdAt';

  @ApiPropertyOptional({
    enum: ORDER_DIRECTIONS,
    default: 'desc',
    description: 'Dirección del ordenamiento',
  })
  @IsOptional()
  @IsString()
  @IsIn(ORDER_DIRECTIONS)
  order?: OrderDirection = 'desc';
}
