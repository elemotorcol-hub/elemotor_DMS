import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryAdminMaintenanceDto {
  @ApiPropertyOptional({ description: 'Filtrar por pedido (orderId)' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  orderId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por tipo de mantenimiento', example: 'Batería' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Registros por página', default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}
