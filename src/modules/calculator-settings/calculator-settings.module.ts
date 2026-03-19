import { Module } from '@nestjs/common';
import { CalculatorSettingsService } from './calculator-settings.service';
import { CalculatorSettingsController } from './calculator-settings.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CalculatorSettingsController],
  providers: [CalculatorSettingsService],
  exports: [CalculatorSettingsService],
})
export class CalculatorSettingsModule {}
