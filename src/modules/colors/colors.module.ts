import { Module } from '@nestjs/common';
import { ColorsService } from './colors.service';
import { ColorsController } from './colors.controller';
import { ColorsRepository } from './colors.repository';

@Module({
  controllers: [ColorsController],
  providers: [ColorsService, ColorsRepository],
  exports: [ColorsService],
})
export class ColorsModule {}
