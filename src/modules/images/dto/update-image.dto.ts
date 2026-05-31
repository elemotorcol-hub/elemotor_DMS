import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ImageType } from '@prisma/client';
import { Type } from 'class-transformer';

/**
 * UpdateImageDto
 *
 * Solo permite actualizar campos de metadatos.
 * No permite cambiar url, publicId ni trimId (el archivo físico no cambia).
 */
export class UpdateImageDto {
  @ApiPropertyOptional({
    example: 'Vista frontal del BYD Atto 3',
    description: 'Texto alternativo (SEO/accesibilidad)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;

  @ApiPropertyOptional({
    enum: ImageType,
    example: ImageType.gallery,
    description: 'Tipo de imagen: gallery, hero, interior, exterior, panoramic',
  })
  @IsOptional()
  @IsEnum(ImageType)
  type?: ImageType;

  @ApiPropertyOptional({
    example: 1,
    description: 'Orden de aparición (menor = primero)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}
