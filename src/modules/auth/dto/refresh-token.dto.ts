import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token válido obtenido en login/register' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
