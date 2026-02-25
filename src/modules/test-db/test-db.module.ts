import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TestDbController } from './test-db.controller';
import { TestDbService } from './test-db.service';

/**
 * TestDbModule
 * Módulo de prueba para verificar la conexión a la base de datos MySQL.
 * Expone el endpoint GET /api/test-db
 */
@Module({
  imports: [DatabaseModule],
  controllers: [TestDbController],
  providers: [TestDbService],
})
export class TestDbModule {}
