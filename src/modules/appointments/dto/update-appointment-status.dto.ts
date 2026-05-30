import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const;
export type AppointmentStatus = typeof APPOINTMENT_STATUSES[number];

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: APPOINTMENT_STATUSES, example: 'confirmed' })
  @IsString()
  @IsIn(APPOINTMENT_STATUSES, {
    message: `status debe ser uno de: ${APPOINTMENT_STATUSES.join(', ')}`,
  })
  status: AppointmentStatus;
}
