import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { QuotesModule } from '../quotes/quotes.module';
import { OrdersModule } from '../orders/orders.module';
import { TrimsModule } from '../trims/trims.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    QuotesModule, 
    OrdersModule, 
    TrimsModule,
    PrismaModule
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
