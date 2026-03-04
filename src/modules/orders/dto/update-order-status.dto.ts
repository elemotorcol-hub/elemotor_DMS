import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.port_origin,
    description: 'Nuevo estado del pedido',
  })
  @IsEnum(OrderStatus, {
    message: `status debe ser uno de: ${Object.values(OrderStatus).join(', ')}`,
  })
  status: OrderStatus;

  @ApiPropertyOptional({
    example: 'Vehículo zarpó desde el puerto de Shangái el 2026-03-04.',
    description: 'Descripción o nota del cambio de estado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
