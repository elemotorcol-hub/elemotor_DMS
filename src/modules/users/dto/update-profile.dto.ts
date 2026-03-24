import {
  IsString,
  IsOptional,
  MaxLength,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para actualizar el perfil del usuario autenticado.
 * Solo se permiten los campos: name, phone, city, avatarUrl.
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Juan Pérez', description: 'Nombre completo' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: '+573001234567', description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: '123456789', description: 'Documento de identidad (cédula)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cedula?: string;

  @ApiPropertyOptional({ example: 'Bogotá', description: 'Ciudad de residencia' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/.../avatar.jpg',
    description: 'URL del avatar del usuario',
  })
  @IsOptional()
  @ValidateIf((o) => o.avatarUrl !== null)
  @IsUrl()
  @MaxLength(500)
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    example: 'avatars/abcde123',
    description: 'Public ID en Cloudinary del avatar',
  })
  @IsOptional()
  @ValidateIf((o) => o.avatarPublicId !== null)
  @IsString()
  @MaxLength(255)
  avatarPublicId?: string | null;
}
