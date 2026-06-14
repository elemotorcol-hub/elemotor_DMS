import { Module } from '@nestjs/common';
import { SupportTicketsController } from './support-tickets.controller';
import { SupportTicketsService } from './support-tickets.service';
import { SupportTicketsRepository } from './support-tickets.repository';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [SupportTicketsController],
  providers: [SupportTicketsService, SupportTicketsRepository],
  exports: [SupportTicketsService],
})
export class SupportTicketsModule {}
