import { Module } from '@nestjs/common';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { BrandsRepository } from './brands.repository';

/**
 * BrandsModule
 * Registra las tres capas: Controller → Service → Repository.
 * La inversión de dependencias se logra via DI de NestJS:
 *   Controller ← BrandsService ← BrandsRepository ← PrismaService (global)
 */
@Module({
  controllers: [BrandsController],
  providers: [BrandsService, BrandsRepository],
  exports: [BrandsService],
})
export class BrandsModule {}
