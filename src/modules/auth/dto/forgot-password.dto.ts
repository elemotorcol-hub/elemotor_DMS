import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'juan@ejemplo.com', description: 'Email registrado en el sistema' })
  @IsEmail()
  email: string;
}
