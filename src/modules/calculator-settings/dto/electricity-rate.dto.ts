import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateElectricityRateDto {
  @ApiProperty({ example: 'Bogotá' })
  @IsString()
  city: string;

  @ApiProperty({ example: 850.5 })
  @IsNumber()
  pricePerKwhCop: number;

  @ApiProperty({ example: 'Enel Colombia', required: false })
  @IsString()
  @IsOptional()
  source?: string;
}

export class UpdateElectricityRateDto extends CreateElectricityRateDto {}
