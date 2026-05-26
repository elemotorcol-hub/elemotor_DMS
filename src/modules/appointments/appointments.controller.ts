import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  /**
   * POST /api/appointments
   * Endpoint público — no requiere autenticación.
   * Cualquier visitante puede agendar una cita de mantenimiento.
   */
  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[Público] Solicitar cita de mantenimiento' })
  @ApiResponse({ status: 201, description: 'Solicitud registrada y notificación enviada.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  create(@Body() dto: CreateAppointmentDto) {
    return this.service.create(dto);
  }
}
