import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para registro de nuevo usuario con email y contraseña.
 * La contraseña debe cumplir requisitos mínimos de seguridad OWASP.
 */
export class RegisterDto {
  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre completo' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'juan@ejemplo.com', description: 'Email único' })
  @IsEmail()
  email: string;

  /**
   * Mínimo 8 chars, al menos: 1 mayúscula, 1 minúscula, 1 número, 1 símbolo.
   * Requisito OWASP Authentication Cheat Sheet.
   */
  @ApiProperty({
    example: 'MiPassword@123',
    description: 'Contraseña segura (mín. 8 chars con mayúscula, número y símbolo)',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message:
      'La contraseña debe tener al menos 1 mayúscula, 1 minúscula, 1 número y 1 símbolo especial',
  })
  password: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;
}
