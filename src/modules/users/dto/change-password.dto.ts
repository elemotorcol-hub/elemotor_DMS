import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para cambiar la contraseña del usuario autenticado.
 * Requiere la contraseña actual y la nueva (cumpliendo requisitos OWASP).
 */
export class ChangePasswordDto {
  @ApiProperty({
    example: 'MiPasswordActual@123',
    description: 'Contraseña actual del usuario',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    example: 'MiPasswordNueva@456',
    description: 'Nueva contraseña (mín. 8 chars con mayúscula, número y símbolo)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message:
      'La contraseña debe tener al menos 1 mayúscula, 1 minúscula, 1 número y 1 símbolo especial',
  })
  newPassword: string;
}
