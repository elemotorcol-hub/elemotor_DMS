import { PrismaClient, TrimStatus, ColorType, ImageType } from '@prisma/client';
import { upsertTrim } from './utils/seeder.utils';

export async function seedTrimsSpecsColorsImages(prisma: PrismaClient) {
  console.log('🏎️  Seeding Trims, Specs, Colors & Images...');

  const sealU = await prisma.model.findUniqueOrThrow({ where: { slug: 'byd-seal-u-2025' } });
  const atto3 = await prisma.model.findUniqueOrThrow({ where: { slug: 'byd-atto-3-2025' } });
  const dolphin = await prisma.model.findUniqueOrThrow({ where: { slug: 'byd-dolphin-2025' } });
  const tiggoE = await prisma.model.findUniqueOrThrow({ where: { slug: 'chery-tiggo-7-pro-e-2025' } });
  const oraCat = await prisma.model.findUniqueOrThrow({ where: { slug: 'ora-good-cat-2025' } });

  const sealUDynamic = await upsertTrim(prisma, sealU.id, 'Dynamic', { modelId: sealU.id, name: 'Dynamic', price: 148_900_000, availableQuantity: 3, status: TrimStatus.stock, active: true });
  const sealUPremium = await upsertTrim(prisma, sealU.id, 'Premium', { modelId: sealU.id, name: 'Premium', price: 165_900_000, availableQuantity: 0, status: TrimStatus.transit, active: true });
  const dolphinStd = await upsertTrim(prisma, dolphin.id, 'Standard Range', { modelId: dolphin.id, name: 'Standard Range', price: 99_900_000, availableQuantity: 5, status: TrimStatus.stock, active: true });
  const oraCatPro = await upsertTrim(prisma, oraCat.id, 'Pro', { modelId: oraCat.id, name: 'Pro', price: 119_900_000, availableQuantity: 2, status: TrimStatus.stock, active: true });
  await upsertTrim(prisma, atto3.id, 'Base', { modelId: atto3.id, name: 'Base', price: 129_900_000, availableQuantity: 0, status: TrimStatus.order, active: true });
  await upsertTrim(prisma, tiggoE.id, 'Base', { modelId: tiggoE.id, name: 'Base', price: 139_900_000, availableQuantity: 0, status: TrimStatus.order, active: true });

  await prisma.$transaction([
    // SPECS
    prisma.spec.createMany({
      skipDuplicates: true,
      data: [
        { trimId: sealUDynamic.id, batteryKwh: 71.8, rangeCltcKm: 520, rangeWltpKm: 420, horsepower: 204, torque: 310, zeroTo100: 7.9, topSpeed: 175, chargeTime3080: '30 min (150 kW DC)', trunkLiters: 440, lengthMm: 4785, widthMm: 1890, heightMm: 1668, wheelbaseMm: 2765, curbWeightKg: 1925, softwareVersion: 3, adasLevel: 2, screenSize: 15, kwhPer100km: 15.8 },
        { trimId: dolphinStd.id, batteryKwh: 44.93, rangeCltcKm: 405, rangeWltpKm: 340, horsepower: 95, torque: 180, zeroTo100: 10.9, topSpeed: 150, chargeTime3080: '25 min (60 kW DC)', trunkLiters: 345, lengthMm: 4150, widthMm: 1770, heightMm: 1570, wheelbaseMm: 2700, curbWeightKg: 1405, softwareVersion: 2, adasLevel: 2, screenSize: 12, kwhPer100km: 13.5 },
        { trimId: oraCatPro.id, batteryKwh: 63.0, rangeCltcKm: 500, rangeWltpKm: 400, horsepower: 171, torque: 250, zeroTo100: 8.5, topSpeed: 160, chargeTime3080: '35 min (80 kW DC)', trunkLiters: 228, lengthMm: 4235, widthMm: 1825, heightMm: 1596, wheelbaseMm: 2650, curbWeightKg: 1680, softwareVersion: 4, adasLevel: 2, screenSize: 10, kwhPer100km: 14.8 },
      ],
    }),
    
    // COLORS
    prisma.color.createMany({
      skipDuplicates: true,
      data: [
        { trimId: sealUDynamic.id, name: 'Cosmic Black', hexCode: '1A1A1A', type: ColorType.exterior, swatchUrl: 'https://res.cloudinary.com/elemotor/image/upload/swatches/black.png' },
        { trimId: sealUDynamic.id, name: 'Polar White', hexCode: 'F5F5F5', type: ColorType.exterior, swatchUrl: 'https://res.cloudinary.com/elemotor/image/upload/swatches/white.png' },
        { trimId: sealUDynamic.id, name: 'Ocean Blue', hexCode: '1E5799', type: ColorType.exterior, swatchUrl: 'https://res.cloudinary.com/elemotor/image/upload/swatches/blue.png' },
        { trimId: sealUDynamic.id, name: 'Black Interior', hexCode: '2B2B2B', type: ColorType.interior },
        { trimId: dolphinStd.id, name: 'Sky Blue', hexCode: '87CEEB', type: ColorType.exterior },
        { trimId: dolphinStd.id, name: 'Lime Green', hexCode: '9ACD32', type: ColorType.exterior },
        { trimId: oraCatPro.id, name: 'Ballet Pink', hexCode: 'FFB6C1', type: ColorType.exterior, swatchUrl: 'https://res.cloudinary.com/elemotor/image/upload/swatches/pink.png' },
        { trimId: oraCatPro.id, name: 'Matte White', hexCode: 'FAFAFA', type: ColorType.exterior },
      ],
    }),

    // IMAGES
    prisma.image.createMany({
      skipDuplicates: true,
      data: [
        { trimId: sealUDynamic.id, url: 'https://res.cloudinary.com/elemotor/image/upload/models/seal-u/hero.jpg', publicId: '', altText: 'BYD Seal U Dynamic — Vista frontal', type: ImageType.hero, sortOrder: 0 },
        { trimId: sealUDynamic.id, url: 'https://res.cloudinary.com/elemotor/image/upload/models/seal-u/gallery1.jpg', publicId: '', altText: 'BYD Seal U Dynamic — Lateral', type: ImageType.gallery, sortOrder: 1 },
        { trimId: dolphinStd.id, url: 'https://res.cloudinary.com/elemotor/image/upload/models/dolphin/hero.jpg', publicId: '', altText: 'BYD Dolphin — Vista frontal', type: ImageType.hero, sortOrder: 0 },
        { trimId: oraCatPro.id, url: 'https://res.cloudinary.com/elemotor/image/upload/models/ora-cat/hero.jpg', publicId: '', altText: 'ORA Good Cat Pro — Vista frontal', type: ImageType.hero, sortOrder: 0 },
      ],
    }),
  ]);
}
