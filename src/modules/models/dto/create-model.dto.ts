import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  IsNumber,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModelType } from '@prisma/client';
import { Type } from 'class-transformer';
import { NestedTrimDto } from './nested-model.dto';
import { ValidateNested } from 'class-validator';

export class CreateModelDto {
  @ApiProperty({ example: 1, description: 'ID de la marca (brandId)' })
  @IsInt()
  @Type(() => Number)
  brandId: number;

  @ApiProperty({ example: 'Atto 3', description: 'Nombre del modelo' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'atto-3', description: 'Slug único del modelo' })
  @IsString()
  @MaxLength(255)
  slug: string;

  @ApiProperty({
    enum: ModelType,
    example: ModelType.SUV,
    description: 'Tipo de carrocería',
  })
  @IsEnum(ModelType)
  type: ModelType;

  @ApiProperty({ example: 2025, description: 'Año del modelo' })
  @IsInt()
  @Min(2000)
  @Type(() => Number)
  year: number;

  @ApiPropertyOptional({ description: 'Descripción detallada del modelo' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 135000000,
    description: 'Precio base en COP',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  basePrice?: number;

  @ApiPropertyOptional({ default: false, description: 'Modelo destacado' })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ default: true, description: 'Modelo activo' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ type: () => [NestedTrimDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NestedTrimDto)
  trims?: NestedTrimDto[];
}
