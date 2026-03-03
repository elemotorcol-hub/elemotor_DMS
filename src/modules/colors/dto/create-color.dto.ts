import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ColorType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateColorDto {
  @ApiProperty({ example: 1, description: 'ID del trim al que pertenece' })
  @IsInt()
  @Type(() => Number)
  trimId: number;

  @ApiProperty({ example: 'Azul Polar', description: 'Nombre del color' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: '#4A90D9',
    description: 'Código hexadecimal del color en formato #RRGGBB (incluyendo el #)',
  })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'hexCode must be a valid HEX color in the format #RRGGBB (e.g. #FF0033)',
  })
  hexCode: string;

  @ApiProperty({
    enum: ColorType,
    example: ColorType.exterior,
    description: 'Tipo de color: exterior o interior',
  })
  @IsEnum(ColorType)
  type: ColorType;

  @ApiPropertyOptional({
    example: 'https://cdn.elemotor.co/colors/azul-polar.jpg',
    description: 'URL de imagen del color',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.elemotor.co/swatches/azul-polar.png',
    description: 'URL del swatch del color',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  swatchUrl?: string;
}
