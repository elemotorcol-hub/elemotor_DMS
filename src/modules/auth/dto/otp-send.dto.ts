import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OtpSendDto {
  @ApiProperty({
    example: '+573001234567',
    description: 'Número de teléfono en formato internacional E.164',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'El número de teléfono debe tener formato internacional (ej: +573001234567)',
  })
  phone: string;
}
