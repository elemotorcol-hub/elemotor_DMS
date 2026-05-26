import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsDateString,
  MaxLength,
  Min,
  Matches,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'juan@correo.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: '3001234567' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phone: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  workshopId?: number;

  @ApiProperty({ example: '2025-06-15' })
  @IsDateString()
  preferredDate: string;

  @ApiPropertyOptional({ example: '10:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'preferredTime debe tener formato HH:MM' })
  preferredTime?: string;

  @ApiProperty({ example: 'Mantenimiento preventivo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serviceType: string;

  @ApiPropertyOptional({ example: 'El vehículo presenta ruido al frenar.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
