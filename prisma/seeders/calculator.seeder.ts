import { PrismaClient, FuelType } from '@prisma/client';

export async function seedCalculatorRates(prisma: PrismaClient) {
  console.log('⚡  Seeding Calculator Rates...');

  await prisma.$transaction([
    prisma.electricityRate.deleteMany({}),
    prisma.fuelPrice.deleteMany({}),
    prisma.electricityRate.createMany({
      data: [
        { city: 'Bogotá',       pricePerKwhCop: 780.5, source: 'CREG - Feb 2025' },
        { city: 'Medellín',     pricePerKwhCop: 720.3, source: 'CREG - Feb 2025' },
        { city: 'Cali',         pricePerKwhCop: 810.0, source: 'CREG - Feb 2025' },
        { city: 'Barranquilla', pricePerKwhCop: 850.2, source: 'CREG - Feb 2025' },
      ],
    }),
    prisma.fuelPrice.createMany({
      data: [
        { city: 'Bogotá',   fuelType: FuelType.regular, pricePerGallonCop: 14_200, source: 'MinMinas - Feb 2025' },
        { city: 'Bogotá',   fuelType: FuelType.premium, pricePerGallonCop: 16_800, source: 'MinMinas - Feb 2025' },
        { city: 'Medellín', fuelType: FuelType.regular, pricePerGallonCop: 14_000, source: 'MinMinas - Feb 2025' },
        { city: 'Medellín', fuelType: FuelType.premium, pricePerGallonCop: 16_600, source: 'MinMinas - Feb 2025' },
        { city: 'Cali',     fuelType: FuelType.regular, pricePerGallonCop: 14_400, source: 'MinMinas - Feb 2025' },
        { city: 'Cali',     fuelType: FuelType.premium, pricePerGallonCop: 17_000, source: 'MinMinas - Feb 2025' },
      ],
    })
  ]);
}
