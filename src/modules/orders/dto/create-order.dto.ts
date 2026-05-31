import {
  IsInt,
  IsPositive,
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/** VIN estándar: 17 caracteres alfanuméricos (excluye I, O, Q) */
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

export class CreateOrderDto {
  @ApiPropertyOptional({ example: 3, description: 'ID del usuario cliente (opcional)' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  userId?: number;

  @ApiProperty({ example: 1, description: 'ID del trim (versión) del vehículo' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  trimId: number;

  @ApiProperty({ example: 2, description: 'ID del color seleccionado' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  colorId: number;

  @ApiPropertyOptional({
    example: 'LVVDB11B4ND123456',
    description: 'VIN del vehículo (17 caracteres, estándar ISO 3779)',
  })
  @IsOptional()
  @IsString()
  @Matches(VIN_REGEX, { message: 'vin debe ser un VIN válido de 17 caracteres alfanuméricos' })
  vin?: string;

  @ApiPropertyOptional({
    example: 'Cliente prioritario — pago anticipado.',
    description: 'Notas internas del pedido',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({
    example: '2026-07-15',
    description: 'Fecha estimada de entrega (ISO 8601 date)',
  })
  @IsOptional()
  @IsDateString()
  estimatedDelivery?: string;

  @ApiPropertyOptional({
    example: 'COT-2026-00001',
    description: 'Código de seguimiento personalizado (opcional, p.ej. para reusar código de cotización)',
  })
  @IsOptional()
  @IsString()
  trackingCode?: string;
}
