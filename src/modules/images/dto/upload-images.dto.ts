import {
  IsInt,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ImageType } from '@prisma/client';
import { Type } from 'class-transformer';

/**
 * UploadImagesDto
 *
 * DTO de campos de formulario para POST /api/images/upload.
 * El archivo físico (file/files) se recibe via @UploadedFiles() — no va en este DTO.
 */
export class UploadImagesDto {
  @ApiProperty({ example: 1, description: 'ID del trim al que pertenecen las imágenes' })
  @IsInt()
  @Type(() => Number)
  trimId: number;

  @ApiProperty({
    enum: ImageType,
    example: ImageType.gallery,
    description: 'Tipo de imagen: gallery, hero, interior, exterior, panoramic',
  })
  @IsEnum(ImageType)
  type: ImageType;

  @ApiPropertyOptional({
    example: 'Vista frontal del BYD Atto 3',
    description: 'Texto alternativo para accesibilidad y SEO (se aplica a todas las imágenes del lote)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'sort_order inicial. Si se sube más de una imagen, se incrementa automáticamente.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}
