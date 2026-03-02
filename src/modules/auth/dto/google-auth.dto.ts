import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para autenticación con Google.
 * Recibe el ID Token generado por Google Sign-In en el frontend.
 */
export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google ID Token obtenido desde el cliente (google.accounts.id)',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
