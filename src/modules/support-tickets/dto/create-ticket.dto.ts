import { IsString, IsOptional, IsEnum, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketCategory } from '@prisma/client';

/**
 * CreateTicketDto — DTO para POST /support-tickets
 * Crea un nuevo ticket de soporte con su primer mensaje.
 */
export class CreateTicketDto {
  @ApiProperty({
    example: 'Problema con la factura de mi pedido',
    description: 'Asunto del ticket',
    maxLength: 255,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  subject: string;

  @ApiProperty({
    example: 'Necesito ayuda con la factura número 1234, aparece un error en los datos.',
    description: 'Mensaje inicial del ticket',
  })
  @IsString()
  @MinLength(10)
  message: string;

  @ApiPropertyOptional({
    enum: TicketCategory,
    example: TicketCategory.billing,
    description: 'Categoría del ticket',
  })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;
}
