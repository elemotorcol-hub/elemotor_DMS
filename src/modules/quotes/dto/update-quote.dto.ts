import { IsOptional, IsEnum, IsInt, IsPositive, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { QuoteStatus } from '@prisma/client';

/**
 * UpdateQuoteDto — Admin-only DTO for PUT /api/quotes/:id.
 *
 * Allows updating status, assigned advisor, internal notes, and contact info.
 * Reference code and UTMs remain immutable after creation.
 */
export class UpdateQuoteDto {
  @ApiPropertyOptional({ example: 'Juan Perez' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'juan@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @IsOptional()
  @IsString()
  phone?: string;
  @ApiPropertyOptional({
    enum: QuoteStatus,
    example: QuoteStatus.contacted,
    description: 'Nuevo estado de la cotización',
  })
  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;

  @ApiPropertyOptional({
    example: 3,
    description: 'ID del asesor al que se asigna la cotización',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  assignedToId?: number;

  @ApiPropertyOptional({
    example: 'Cliente muy interesado, llamar en la tarde.',
    description: 'Notas internas del asesor',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @ApiPropertyOptional({
    example: 'Elemotor Sedan',
    description: 'Modelo de interés actualizado',
  })
  @IsOptional()
  @IsString()
  modelInterest?: string;

  @ApiPropertyOptional({
    example: 85000000,
    description: 'Rango de presupuesto actualizado',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  budgetRange?: number;
}
