import { Module } from '@nestjs/common';
import { WorkshopsController } from './workshops.controller';
import { WorkshopsService } from './workshops.service';
import { WorkshopsRepository } from './workshops.repository';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [WorkshopsController],
  providers: [WorkshopsService, WorkshopsRepository],
  exports: [WorkshopsService],
})
export class WorkshopsModule {}
