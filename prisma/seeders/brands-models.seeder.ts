import { PrismaClient, ModelType } from '@prisma/client';

export async function seedBrandsAndModels(prisma: PrismaClient) {
  console.log('🚙  Seeding Brands & Models...');

  // BRANDS
  const byd = await prisma.brand.upsert({
    where: { slug: 'byd' },
    update: {},
    create: { name: 'BYD', slug: 'byd', logoUrl: 'https://res.cloudinary.com/elemotor/image/upload/brands/byd-logo.png', country: 'China', active: true },
  });
  const chery = await prisma.brand.upsert({
    where: { slug: 'chery' },
    update: {},
    create: { name: 'Chery', slug: 'chery', logoUrl: 'https://res.cloudinary.com/elemotor/image/upload/brands/chery-logo.png', country: 'China', active: true },
  });
  const ora = await prisma.brand.upsert({
    where: { slug: 'ora' },
    update: {},
    create: { name: 'ORA', slug: 'ora', logoUrl: 'https://res.cloudinary.com/elemotor/image/upload/brands/ora-logo.png', country: 'China', active: true },
  });

  // MODELS
  await prisma.$transaction([
    prisma.model.upsert({
      where: { slug: 'byd-seal-u-2025' },
      update: {},
      create: { brandId: byd.id, name: 'Seal U', slug: 'byd-seal-u-2025', type: ModelType.SUV, year: 2025, description: 'SUV eléctrico premium de BYD con autonomía extendida.', basePrice: 148_900_000, featured: true, active: true },
    }),
    prisma.model.upsert({
      where: { slug: 'byd-atto-3-2025' },
      update: {},
      create: { brandId: byd.id, name: 'Atto 3', slug: 'byd-atto-3-2025', type: ModelType.SUV, year: 2025, description: 'Compacto SUV eléctrico con diseño vanguardista.', basePrice: 129_900_000, featured: false, active: true },
    }),
    prisma.model.upsert({
      where: { slug: 'byd-dolphin-2025' },
      update: {},
      create: { brandId: byd.id, name: 'Dolphin', slug: 'byd-dolphin-2025', type: ModelType.Hatchback, year: 2025, description: 'Hatchback eléctrico urbano con gran eficiencia.', basePrice: 99_900_000, featured: true, active: true },
    }),
    prisma.model.upsert({
      where: { slug: 'chery-tiggo-7-pro-e-2025' },
      update: {},
      create: { brandId: chery.id, name: 'Tiggo 7 Pro E', slug: 'chery-tiggo-7-pro-e-2025', type: ModelType.SUV, year: 2025, description: 'SUV eléctrico de Chery con tecnología PHEV avanzada.', basePrice: 139_900_000, featured: false, active: true },
    }),
    prisma.model.upsert({
      where: { slug: 'ora-good-cat-2025' },
      update: {},
      create: { brandId: ora.id, name: 'Good Cat', slug: 'ora-good-cat-2025', type: ModelType.Hatchback, year: 2025, description: 'Diseño retro-futurista y cero emisiones de ORA.', basePrice: 119_900_000, featured: true, active: true },
    }),
  ]);
}
