import { Module } from '@nestjs/common';
import { TrimsService } from './trims.service';
import { TrimsController } from './trims.controller';
import { TrimsRepository } from './trims.repository';

@Module({
  controllers: [TrimsController],
  providers: [TrimsService, TrimsRepository],
  exports: [TrimsService],
})
export class TrimsModule {}
