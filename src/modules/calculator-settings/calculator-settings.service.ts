import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateElectricityRateDto, UpdateElectricityRateDto, CreateFuelPriceDto, UpdateFuelPriceDto } from './dto';

@Injectable()
export class CalculatorSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Electricity Rates ───────────────────────────────────────────────────

  async findAllElectricityRates() {
    return this.prisma.electricityRate.findMany({
      orderBy: { city: 'asc' },
    });
  }

  async createElectricityRate(dto: CreateElectricityRateDto) {
    return this.prisma.electricityRate.create({
      data: {
        city: dto.city,
        pricePerKwhCop: dto.pricePerKwhCop,
        source: dto.source,
      },
    });
  }

  async updateElectricityRate(id: number, dto: UpdateElectricityRateDto) {
    const exists = await this.prisma.electricityRate.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Tarifa de energía #${id} no encontrada`);

    return this.prisma.electricityRate.update({
      where: { id },
      data: {
        city: dto.city,
        pricePerKwhCop: dto.pricePerKwhCop,
        source: dto.source,
      },
    });
  }

  async deleteElectricityRate(id: number) {
    const exists = await this.prisma.electricityRate.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Tarifa de energía #${id} no encontrada`);

    return this.prisma.electricityRate.delete({ where: { id } });
  }

  // ─── Fuel Prices ─────────────────────────────────────────────────────────

  async findAllFuelPrices() {
    return this.prisma.fuelPrice.findMany({
      orderBy: { city: 'asc' },
    });
  }

  async createFuelPrice(dto: CreateFuelPriceDto) {
    return this.prisma.fuelPrice.create({
      data: {
        city: dto.city,
        fuelType: dto.fuelType,
        pricePerGallonCop: dto.pricePerGallonCop,
        source: dto.source,
      },
    });
  }

  async updateFuelPrice(id: number, dto: UpdateFuelPriceDto) {
    const exists = await this.prisma.fuelPrice.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Precio de combustible #${id} no encontrado`);

    return this.prisma.fuelPrice.update({
      where: { id },
      data: {
        city: dto.city,
        fuelType: dto.fuelType,
        pricePerGallonCop: dto.pricePerGallonCop,
        source: dto.source,
      },
    });
  }

  async deleteFuelPrice(id: number) {
    const exists = await this.prisma.fuelPrice.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Precio de combustible #${id} no encontrado`);

    return this.prisma.fuelPrice.delete({ where: { id } });
  }
}
