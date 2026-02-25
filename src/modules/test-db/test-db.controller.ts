import { Controller, Get } from '@nestjs/common';
import { TestDbService } from './test-db.service';

/**
 * TestDbController
 * Expone el endpoint de prueba de conexión a la base de datos.
 * Ruta: GET /api/test-db
 */
@Controller('test-db')
export class TestDbController {
  constructor(private readonly testDbService: TestDbService) {}

  @Get()
  async testConnection(): Promise<{ status: string; message: string }> {
    return this.testDbService.checkConnection();
  }
}
