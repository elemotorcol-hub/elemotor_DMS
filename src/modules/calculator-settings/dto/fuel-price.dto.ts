import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FuelType } from '@prisma/client';

export class CreateFuelPriceDto {
  @ApiProperty({ example: 'Bogotá' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'regular', enum: FuelType })
  @IsEnum(FuelType)
  fuelType: FuelType;

  @ApiProperty({ example: 15400.0 })
  @IsNumber()
  pricePerGallonCop: number;

  @ApiProperty({ example: 'MinMinas', required: false })
  @IsString()
  @IsOptional()
  source?: string;
}

export class UpdateFuelPriceDto extends CreateFuelPriceDto {}
