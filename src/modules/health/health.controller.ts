import { Controller, Get } from '@nestjs/common';

/**
 * HealthController
 * Endpoint raíz para verificar que el servidor está activo.
 * Ruta: GET /api
 */
@Controller()
export class HealthController {
  @Get()
  getHealth(): { status: string; app: string; version: string; timestamp: string } {
    return {
      status: 'ok',
      app: 'EleMotor API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
