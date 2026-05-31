import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

/**
 * HealthController
 *
 * Endpoint para verificar que el servicio está activo.
 * Ruta: GET /api/health
 */
@Public()
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check del servicio' })
  @ApiResponse({
    status: 200,
    description: 'Servicio operativo',
    schema: {
      example: {
        status: 'ok',
        service: 'elemotor_DMS',
        timestamp: '2026-02-25T20:00:00.000Z',
      },
    },
  })
  getHealth(): { status: string; service: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'elemotor_DMS',
      timestamp: new Date().toISOString(),
    };
  }
}
