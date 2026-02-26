import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService
 *
 * Wraps PrismaClient and handles connection lifecycle
 * within the NestJS module system.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('✅ Prisma connected to MySQL');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('🔌 Prisma disconnected from MySQL');
  }
}
