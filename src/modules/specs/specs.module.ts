import { Module } from '@nestjs/common';
import { SpecsService } from './specs.service';
import { SpecsController } from './specs.controller';
import { SpecsRepository } from './specs.repository';

@Module({
  controllers: [SpecsController],
  providers: [SpecsService, SpecsRepository],
  exports: [SpecsService],
})
export class SpecsModule {}
