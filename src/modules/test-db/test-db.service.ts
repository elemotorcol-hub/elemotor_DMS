import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * TestDbService
 * Realiza una consulta simple (SELECT 1) para verificar la conexión a MySQL vía Prisma.
 */
@Injectable()
export class TestDbService {
  private readonly logger = new Logger(TestDbService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkConnection(): Promise<{ status: string; message: string }> {
    try {
      // Consulta mínima para verificar la conexión
      await this.prisma.$queryRawUnsafe('SELECT 1');
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
