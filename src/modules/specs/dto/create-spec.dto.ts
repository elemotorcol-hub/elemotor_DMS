import {
  IsInt,
  IsOptional,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSpecDto {
  @ApiProperty({ example: 1, description: 'ID del trim (único, 1-to-1)' })
  @IsInt()
  @Type(() => Number)
  trimId: number;

  @ApiPropertyOptional({ example: 60.48, description: 'Batería en kWh' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  batteryKwh?: number;

  @ApiPropertyOptional({ example: 480, description: 'Autonomía CLTC en km' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  rangeCltcKm?: number;

  @ApiPropertyOptional({ example: 400, description: 'Autonomía WLTP en km' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  rangeWltpKm?: number;

  @ApiPropertyOptional({ example: 204, description: 'Potencia en HP' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  horsepower?: number;

  @ApiPropertyOptional({ example: 310, description: 'Torque en Nm' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  torque?: number;

  @ApiPropertyOptional({
    example: 7.3,
    description: '0 a 100 km/h en segundos',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  zeroTo100?: number;

  @ApiPropertyOptional({
    example: 160,
    description: 'Velocidad máxima en km/h',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  topSpeed?: number;

  @ApiPropertyOptional({
    example: '30 min',
    description: 'Tiempo de carga 30-80%',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  chargeTime3080?: string;

  @ApiPropertyOptional({
    example: 440,
    description: 'Capacidad del maletero en litros',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  trunkLiters?: number;

  @ApiPropertyOptional({ example: 4455, description: 'Longitud en mm' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  lengthMm?: number;

  @ApiPropertyOptional({ example: 1875, description: 'Ancho en mm' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  widthMm?: number;

  @ApiPropertyOptional({ example: 1615, description: 'Alto en mm' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  heightMm?: number;

  @ApiPropertyOptional({
    example: 2720,
    description: 'Distancia entre ejes en mm',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  wheelbaseMm?: number;

  @ApiPropertyOptional({ example: 1750, description: 'Peso en vacío en kg' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  curbWeightKg?: number;

  @ApiPropertyOptional({ example: 3, description: 'Versión del software' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  softwareVersion?: number;

  @ApiPropertyOptional({ example: 2, description: 'Nivel ADAS' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  adasLevel?: number;

  @ApiPropertyOptional({
    example: 15,
    description: 'Tamaño de pantalla en pulgadas',
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  screenSize?: number;

  @ApiPropertyOptional({ example: 15.2, description: 'Consumo en kWh/100km' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  kwhPer100km?: number;
}
