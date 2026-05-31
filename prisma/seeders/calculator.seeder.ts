import { PrismaClient, FuelType } from '@prisma/client';

export async function seedCalculatorRates(prisma: PrismaClient) {
  console.log('⚡  Seeding Calculator Rates (Full Update March 2024)...');

  const sourceGas = 'MinMinas - Marzo 2024';

  await prisma.$transaction([
    prisma.electricityRate.deleteMany({}),
    prisma.fuelPrice.deleteMany({}),
    prisma.electricityRate.createMany({
      data: [
        { city: 'Bogotá',        pricePerKwhCop: 780.5, source: 'CREG - Feb 2025' },
        { city: 'Medellín',      pricePerKwhCop: 720.3, source: 'CREG - Feb 2025' },
        { city: 'Cali',          pricePerKwhCop: 810.0, source: 'CREG - Feb 2025' },
        { city: 'Barranquilla',  pricePerKwhCop: 850.2, source: 'CREG - Feb 2025' },
        { city: 'Cartagena',     pricePerKwhCop: 855.0, source: 'CREG - Feb 2025' },
        { city: 'Montería',      pricePerKwhCop: 860.0, source: 'CREG - Feb 2025' },
        { city: 'Bucaramanga',   pricePerKwhCop: 790.0, source: 'CREG - Feb 2025' },
        { city: 'Villavicencio',  pricePerKwhCop: 805.0, source: 'CREG - Feb 2025' },
        { city: 'Pereira',       pricePerKwhCop: 795.0, source: 'CREG - Feb 2025' },
        { city: 'Manizales',     pricePerKwhCop: 800.0, source: 'CREG - Feb 2025' },
        { city: 'Ibagué',        pricePerKwhCop: 815.0, source: 'CREG - Feb 2025' },
        { city: 'Pasto',         pricePerKwhCop: 750.0, source: 'CREG - Feb 2025' },
        { city: 'Cúcuta',        pricePerKwhCop: 770.0, source: 'CREG - Feb 2025' },
      ],
    }),
    prisma.fuelPrice.createMany({
      data: [
        // Bogotá
        { city: 'Bogotá', fuelType: FuelType.regular, pricePerGallonCop: 15491, source: sourceGas },
        { city: 'Bogotá', fuelType: FuelType.diesel,  pricePerGallonCop: 11276, source: sourceGas },
        { city: 'Bogotá', fuelType: FuelType.premium, pricePerGallonCop: 18200, source: sourceGas },
        
        // Medellín
        { city: 'Medellín', fuelType: FuelType.regular, pricePerGallonCop: 15411, source: sourceGas },
        { city: 'Medellín', fuelType: FuelType.diesel,  pricePerGallonCop: 11301, source: sourceGas },
        { city: 'Medellín', fuelType: FuelType.premium, pricePerGallonCop: 18100, source: sourceGas },
        
        // Cali
        { city: 'Cali',     fuelType: FuelType.regular, pricePerGallonCop: 15500, source: sourceGas },
        { city: 'Cali',     fuelType: FuelType.diesel,  pricePerGallonCop: 11424, source: sourceGas },
        { city: 'Cali',     fuelType: FuelType.premium, pricePerGallonCop: 18300, source: sourceGas },

        // Barranquilla
        { city: 'Barranquilla', fuelType: FuelType.regular, pricePerGallonCop: 15124, source: sourceGas },
        { city: 'Barranquilla', fuelType: FuelType.diesel,  pricePerGallonCop: 10951, source: sourceGas },
        { city: 'Barranquilla', fuelType: FuelType.premium, pricePerGallonCop: 17800, source: sourceGas },

        // Cartagena
        { city: 'Cartagena',    fuelType: FuelType.regular, pricePerGallonCop: 15081, source: sourceGas },
        { city: 'Cartagena',    fuelType: FuelType.diesel,  pricePerGallonCop: 10916, source: sourceGas },
        { city: 'Cartagena',    fuelType: FuelType.premium, pricePerGallonCop: 17750, source: sourceGas },

        // Montería
        { city: 'Montería',     fuelType: FuelType.regular, pricePerGallonCop: 15331, source: sourceGas },
        { city: 'Montería',     fuelType: FuelType.diesel,  pricePerGallonCop: 11166, source: sourceGas },
        { city: 'Montería',     fuelType: FuelType.premium, pricePerGallonCop: 18000, source: sourceGas },

        // Bucaramanga
        { city: 'Bucaramanga',  fuelType: FuelType.regular, pricePerGallonCop: 15249, source: sourceGas },
        { city: 'Bucaramanga',  fuelType: FuelType.diesel,  pricePerGallonCop: 11025, source: sourceGas },
        { city: 'Bucaramanga',  fuelType: FuelType.premium, pricePerGallonCop: 17950, source: sourceGas },

        // Villavicencio
        { city: 'Villavicencio', fuelType: FuelType.regular, pricePerGallonCop: 15591, source: sourceGas },
        { city: 'Villavicencio', fuelType: FuelType.diesel,  pricePerGallonCop: 11376, source: sourceGas },
        { city: 'Villavicencio', fuelType: FuelType.premium, pricePerGallonCop: 18400, source: sourceGas },

        // Pereira
        { city: 'Pereira',      fuelType: FuelType.regular, pricePerGallonCop: 15436, source: sourceGas },
        { city: 'Pereira',      fuelType: FuelType.diesel,  pricePerGallonCop: 11363, source: sourceGas },
        { city: 'Pereira',      fuelType: FuelType.premium, pricePerGallonCop: 18150, source: sourceGas },

        // Manizales
        { city: 'Manizales',    fuelType: FuelType.regular, pricePerGallonCop: 15464, source: sourceGas },
        { city: 'Manizales',    fuelType: FuelType.diesel,  pricePerGallonCop: 11349, source: sourceGas },
        { city: 'Manizales',    fuelType: FuelType.premium, pricePerGallonCop: 18200, source: sourceGas },

        // Ibagué
        { city: 'Ibagué',       fuelType: FuelType.regular, pricePerGallonCop: 15405, source: sourceGas },
        { city: 'Ibagué',       fuelType: FuelType.diesel,  pricePerGallonCop: 11267, source: sourceGas },
        { city: 'Ibagué',       fuelType: FuelType.premium, pricePerGallonCop: 18100, source: sourceGas },

        // Pasto
        { city: 'Pasto',        fuelType: FuelType.regular, pricePerGallonCop: 13247, source: sourceGas },
        { city: 'Pasto',        fuelType: FuelType.diesel,  pricePerGallonCop: 10338, source: sourceGas },
        { city: 'Pasto',        fuelType: FuelType.premium, pricePerGallonCop: 16000, source: sourceGas },

        // Cúcuta
        { city: 'Cúcuta',       fuelType: FuelType.regular, pricePerGallonCop: 13626, source: sourceGas },
        { city: 'Cúcuta',       fuelType: FuelType.diesel,  pricePerGallonCop: 9255,  source: sourceGas },
        { city: 'Cúcuta',       fuelType: FuelType.premium, pricePerGallonCop: 16500, source: sourceGas },
      ],
    })
  ]);
}
