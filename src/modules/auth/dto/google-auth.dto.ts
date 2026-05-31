import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para autenticación con Google.
 * Recibe el Access Token obtenido desde el cliente con @react-oauth/google.
 */
export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google Access Token obtenido desde el cliente',
    example: 'ya29.a0...',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
