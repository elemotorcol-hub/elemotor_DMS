import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OtpVerifyDto {
  @ApiProperty({ example: '+573001234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'El número de teléfono debe tener formato internacional',
  })
  phone: string;

  @ApiProperty({ example: '482910', description: 'Código OTP de 6 dígitos' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'El código OTP debe tener exactamente 6 dígitos' })
  @Matches(/^\d{6}$/, { message: 'El código OTP solo puede contener dígitos' })
  code: string;
}
