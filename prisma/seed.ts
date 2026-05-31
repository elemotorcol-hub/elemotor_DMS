import { PrismaClient } from '@prisma/client';

// Import Seeders — originales
import { seedBrandsAndModels } from './seeders/brands-models.seeder';
import { seedTrimsSpecsColorsImages } from './seeders/trims.seeder';
import { seedUsersAndOrders } from './seeders/users-orders.seeder';
import { seedWorkshops } from './seeders/workshops.seeder';
import { seedCalculatorRates } from './seeders/calculator.seeder';

// Import Seeders — complementarios
import { seedExtraTrimsAndSpecs } from './seeders/extra-trims.seeder';
import { seedExtraUsersOrdersAndQuotes } from './seeders/extra-users-orders.seeder';
import { seedExtraWorkshops } from './seeders/extra-workshops.seeder';

const prisma = new PrismaClient();

async function main() {
  console.log('──────────────────────────────────────────────────');
  console.log('🌱 Iniciando ejecución de Seeders Prisma');
  console.log('──────────────────────────────────────────────────\n');

  // Wrapper para ejecutar seeders con manejo de errores detallado
  async function runSeeder(name: string, seederFn: (prisma: PrismaClient) => Promise<void>) {
    try {
      await seederFn(prisma);
    } catch (error) {
      console.error(`\n❌ Error crítico ejecutando el seeder: [${name}]`);
      console.error(error);
      process.exit(1);
    }
  }

  try {
    // ── Seeders originales ─────────────────────────────────────────────────
    await runSeeder('Brands & Models', seedBrandsAndModels);
    await runSeeder('Trims, Specs, Colors & Images', seedTrimsSpecsColorsImages);
    await runSeeder('Users, Orders & Quotes', seedUsersAndOrders);
    await runSeeder('Workshops', seedWorkshops);
    await runSeeder('Calculator Rates', seedCalculatorRates);

    // ── Seeders complementarios (extienden sin duplicar) ───────────────────
    await runSeeder('Extra Trims & Specs', seedExtraTrimsAndSpecs);
    await runSeeder('Extra Users, Orders & Quotes', seedExtraUsersOrdersAndQuotes);
    await runSeeder('Extra Workshops', seedExtraWorkshops);

    console.log('\n──────────────────────────────────────────────────');
    console.log('🎉 Seed completado exitosamente en todos los módulos.');
    console.log('──────────────────────────────────────────────────\n');
  } catch (error) {
    console.error('❌ Error general desconocido ejecutando el seed:');
    console.error(error);
    process.exit(1);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
