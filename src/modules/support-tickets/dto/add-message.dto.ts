import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * AddMessageDto — DTO para POST /support-tickets/:id/messages
 * Agrega un nuevo mensaje a un ticket existente.
 */
export class AddMessageDto {
  @ApiProperty({
    example: 'Gracias por contactarnos, revisaremos su caso a la brevedad.',
    description: 'Cuerpo del mensaje',
  })
  @IsString()
  @MinLength(1)
  body: string;
}
