import { IsOptional, IsString, IsDateString, MaxLength, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** VIN estándar: 17 caracteres alfanuméricos (excluye I, O, Q) */
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

/**
 * UpdateOrderDto — Solo campos editables por admin.
 *
 * ⚠️  trackingCode y userId NO están aquí a propósito.
 * El ValidationPipe global con `forbidNonWhitelisted: true` lanzará
 * un 400 automáticamente si el cliente los envía.
 */
export class UpdateOrderDto {
  @ApiPropertyOptional({
    example: 'LVVDB11B4ND123456',
    description: 'VIN del vehículo (17 caracteres, estándar ISO 3779)',
  })
  @IsOptional()
  @IsString()
  @Matches(VIN_REGEX, { message: 'vin debe ser un VIN válido de 17 caracteres alfanuméricos' })
  vin?: string;

  @ApiPropertyOptional({
    example: 'Actualización de notas internas.',
    description: 'Notas internas del pedido',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({
    example: '2026-09-01',
    description: 'Nueva fecha estimada de entrega (ISO 8601 date)',
  })
  @IsOptional()
  @IsDateString()
  estimatedDelivery?: string;
}
