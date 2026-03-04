import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * QueryMyOrderDto — Query params para los endpoints de CLIENTE.
 * Separado del QueryOrderDto de admin para:
 *  1. Evitar exponer filtros de admin en Swagger.
 *  2. Prevenir que el ValidationPipe rechace requests con campos inexperados.
 *  3. Principio de mínimo privilegio: el cliente solo pagina sus propios pedidos.
 */
export class QueryMyOrderDto {
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
