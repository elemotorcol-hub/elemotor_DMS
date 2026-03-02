import { Module } from '@nestjs/common';
import { ModelsController } from './models.controller';
import { ModelsService } from './models.service';
import { ModelsRepository } from './models.repository';

/**
 * ModelsModule
 * Registra las tres capas: Controller → Service → Repository.
 * La inversión de dependencias se logra via DI de NestJS:
 *   Controller ← ModelsService ← ModelsRepository ← PrismaService (global)
 */
@Module({
  controllers: [ModelsController],
  providers: [ModelsService, ModelsRepository],
  exports: [ModelsService],
})
export class ModelsModule {}
