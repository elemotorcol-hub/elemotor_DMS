import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';

/**
 * UpdateTicketStatusDto — DTO para PATCH /support-tickets/:id/status
 * Actualiza el estado de un ticket de soporte.
 */
export class UpdateTicketStatusDto {
  @ApiProperty({
    enum: TicketStatus,
    example: TicketStatus.resolved,
    description: 'Nuevo estado del ticket',
  })
  @IsEnum(TicketStatus)
  status: TicketStatus;
}
