import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ImageType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateImageDto {
  @ApiProperty({ example: 1, description: 'ID del trim al que pertenece' })
  @IsInt()
  @Type(() => Number)
  trimId: number;

  @ApiProperty({
    example: 'https://cdn.elemotor.co/images/atto3-hero.jpg',
    description: 'URL de la imagen',
  })
  @IsString()
  @MaxLength(500)
  url: string;

  @ApiPropertyOptional({
    example: 'Vista frontal del BYD Atto 3',
    description: 'Texto alternativo (SEO/accesibilidad)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;

  @ApiProperty({
    enum: ImageType,
    example: ImageType.hero,
    description: 'Tipo de imagen: gallery, hero, interior, exterior, panoramic',
  })
  @IsEnum(ImageType)
  type: ImageType;

  @ApiPropertyOptional({
    example: 0,
    description: 'Orden de aparición (menor = primero)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}
