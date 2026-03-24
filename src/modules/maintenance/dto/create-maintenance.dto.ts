import { IsInt, IsString, IsOptional, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateMaintenanceDto {
  @ApiProperty({ description: 'ID del pedido asociado (debe estar en estado delivered)' })
  @IsInt()
  orderId: number;

  @ApiProperty({ description: 'Fecha en que se realizó el mantenimiento (ISO date)' })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Tipo de mantenimiento',
    example: 'Preventivo',
    enum: ['Preventivo', 'Revisión', 'Frenos', 'Batería', 'Suspensión', 'Software', 'Otro'],
  })
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: 'ID del taller donde se realizó' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  workshopId?: number;

  @ApiPropertyOptional({ description: 'Calificación del servicio (1 a 5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @ApiPropertyOptional({ description: 'Comentario opcional sobre el servicio' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: 'Costo del mantenimiento (COP)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cost?: number;
}
