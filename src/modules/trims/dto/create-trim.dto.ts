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
import { TrimStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateTrimDto {
  @ApiProperty({ example: 1, description: 'ID del modelo (modelId)' })
  @IsInt()
  @Type(() => Number)
  modelId: number;

  @ApiProperty({ example: 'Extended Range', description: 'Nombre del trim' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 148900000, description: 'Precio en COP' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({ example: 5, description: 'Unidades disponibles' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  availableQuantity?: number;

  @ApiProperty({
    enum: TrimStatus,
    example: TrimStatus.stock,
    description: 'Estado de disponibilidad del trim',
  })
  @IsEnum(TrimStatus)
  status: TrimStatus;

  @ApiPropertyOptional({ default: true, description: 'Trim activo' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
