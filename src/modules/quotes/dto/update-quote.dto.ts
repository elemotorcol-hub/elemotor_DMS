import { IsOptional, IsEnum, IsInt, IsPositive, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { QuoteStatus } from '@prisma/client';

/**
 * UpdateQuoteDto — Admin-only DTO for PUT /api/quotes/:id.
 *
 * Allows updating status, assigned advisor, and internal notes.
 * Reference code, contact info and UTMs are immutable after creation.
 */
export class UpdateQuoteDto {
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
}
