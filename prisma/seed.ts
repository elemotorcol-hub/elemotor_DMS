import { PrismaClient } from '@prisma/client';

// Import Seeders
import { seedBrandsAndModels } from './seeders/brands-models.seeder';
import { seedTrimsSpecsColorsImages } from './seeders/trims.seeder';
import { seedUsersAndOrders } from './seeders/users-orders.seeder';
import { seedWorkshops } from './seeders/workshops.seeder';
import { seedCalculatorRates } from './seeders/calculator.seeder';

const prisma = new PrismaClient();

async function main() {
  console.log('──────────────────────────────────────────────────');
  console.log('🌱 Iniciando ejecución de Seeders Prisma');
  console.log('──────────────────────────────────────────────────\n');

  try {
    await seedBrandsAndModels(prisma);
    await seedTrimsSpecsColorsImages(prisma);
    await seedUsersAndOrders(prisma);
    await seedWorkshops(prisma);
    await seedCalculatorRates(prisma);

    console.log('\n──────────────────────────────────────────────────');
    console.log('🎉 Seed completado exitosamente en todos los módulos.');
    console.log('──────────────────────────────────────────────────\n');
  } catch (error) {
    console.error('❌ Error general ejecutando el seed:');
    console.error(error);
    process.exit(1);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
