import { IsOptional, IsEnum, IsInt, IsPositive, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TicketStatus } from '@prisma/client';

/**
 * QueryTicketsDto — Filtros para listar tickets de soporte.
 */
export class QueryTicketsDto {
  @ApiPropertyOptional({
    enum: TicketStatus,
    description: 'Filtrar por estado del ticket',
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({
    type: Number,
    description: 'Filtrar por ID de usuario (solo admin)',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  userId?: number;

  @ApiPropertyOptional({ description: 'Página actual', minimum: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Elementos por página',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}
