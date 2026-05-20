import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsInt,
  IsPositive,
  MaxLength,
  IsDecimal,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PreferredChannel } from '@prisma/client';

/**
 * CreateQuoteDto — DTO for public POST /api/quotes.
 *
 * Captures lead contact info, vehicle preference, UTM tracking params,
 * and communication channel preference.
 */
export class CreateQuoteDto {
  // ─── Contact info ───────────────────────────────────────────────────────────

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre completo del solicitante' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'juan@elemotor.co', description: 'Correo electrónico' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiPropertyOptional({ example: '+573001234567', description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: 'Bogotá', description: 'Ciudad de residencia' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;
  @ApiPropertyOptional({ example: 'Colombia', description: 'País de residencia' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
  @ApiPropertyOptional({
    example: 'ELE-2026-00001',
    description: 'Código de seguimiento para vincular a un pedido existente',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingCode?: string;

  // ─── Vehicle preference ─────────────────────────────────────────────────────

  @ApiPropertyOptional({ example: 1, description: 'ID del modelo de interés' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  modelId?: number;

  @ApiPropertyOptional({ example: 2, description: 'ID de la versión (trim) de interés' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  trimId?: number;

  @ApiPropertyOptional({
    example: 150000000,
    description: 'Presupuesto aproximado (COP)',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  budgetRange?: number;

  @ApiPropertyOptional({ example: 3, description: 'ID del asesor asignado' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  assignedToId?: number;

  @ApiPropertyOptional({ example: 'Blanco', description: 'Color de interés del vehículo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  color?: string;

  @ApiPropertyOptional({
    example: 'credito_banco',
    description: 'Forma de pago preferida (credito_banco, recursos_propios, no_definido)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentMethod?: string;

  // ─── Communication ──────────────────────────────────────────────────────────

  @ApiProperty({
    enum: PreferredChannel,
    example: PreferredChannel.whatsapp,
    description: 'Canal preferido de contacto',
  })
  @IsEnum(PreferredChannel)
  preferredChannel: PreferredChannel;

  @ApiPropertyOptional({
    example: 'Me interesa el modelo eléctrico con mayor autonomía.',
    description: 'Mensaje libre del solicitante',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  // ─── UTM tracking ───────────────────────────────────────────────────────────

  @ApiPropertyOptional({ example: 'google', description: 'utm_source' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmSource?: string;

  @ApiPropertyOptional({ example: 'cpc', description: 'utm_medium' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmMedium?: string;

  @ApiPropertyOptional({ example: 'black_friday_2026', description: 'utm_campaign' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  utmCampaign?: string;

  // ─── Source ─────────────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    example: 'web',
    description: 'Fuente de la cotización (e.g. web, landing, whatsapp)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;
}
