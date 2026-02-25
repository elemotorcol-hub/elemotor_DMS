import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * TestDbService
 * Realiza una consulta simple (SELECT 1) para verificar la conexión a MySQL.
 */
@Injectable()
export class TestDbService {
  private readonly logger = new Logger(TestDbService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async checkConnection(): Promise<{ status: string; message: string }> {
    try {
      // Consulta mínima para verificar la conexión
      await this.dataSource.query('SELECT 1');
      this.logger.log('✅ Database connection verified via test endpoint');
      return {
        status: 'ok',
        message: 'Database connection successful',
      };
    } catch (error) {
      this.logger.error('❌ Database connection failed', error);
      throw new ServiceUnavailableException('Database connection failed');
    }
  }
}
