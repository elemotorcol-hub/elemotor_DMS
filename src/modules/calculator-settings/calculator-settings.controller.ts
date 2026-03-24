import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CalculatorSettingsService } from './calculator-settings.service';
import { CreateElectricityRateDto, UpdateElectricityRateDto, CreateFuelPriceDto, UpdateFuelPriceDto } from './dto';

@ApiTags('calculator-settings')
@ApiBearerAuth()
@Controller('calculator-settings')
export class CalculatorSettingsController {
  constructor(private readonly service: CalculatorSettingsService) {}

  // ─── Electricity Rates ───────────────────────────────────────────────────

  @Get('electricity')
  @Public()
  @ApiOperation({ summary: 'Listar todas las tarifas de energía' })
  findAllElectricity() {
    return this.service.findAllElectricityRates();
  }

  @Post('electricity')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: '[Admin] Crear tarifa de energía' })
  createElectricity(@Body() dto: CreateElectricityRateDto) {
    return this.service.createElectricityRate(dto);
  }

  @Put('electricity/:id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: '[Admin] Actualizar tarifa de energía' })
  updateElectricity(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateElectricityRateDto) {
    return this.service.updateElectricityRate(id, dto);
  }

  @Delete('electricity/:id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Eliminar tarifa de energía' })
  deleteElectricity(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteElectricityRate(id);
  }

  // ─── Fuel Prices ─────────────────────────────────────────────────────────

  @Get('fuel')
  @Public()
  @ApiOperation({ summary: 'Listar todos los precios de combustible' })
  findAllFuel() {
    return this.service.findAllFuelPrices();
  }

  @Post('fuel')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: '[Admin] Crear precio de combustible' })
  createFuel(@Body() dto: CreateFuelPriceDto) {
    return this.service.createFuelPrice(dto);
  }

  @Put('fuel/:id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: '[Admin] Actualizar precio de combustible' })
  updateFuel(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFuelPriceDto) {
    return this.service.updateFuelPrice(id, dto);
  }

  @Delete('fuel/:id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Eliminar precio de combustible' })
  deleteFuel(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteFuelPrice(id);
  }
}
