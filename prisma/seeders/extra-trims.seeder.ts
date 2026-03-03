import {
  PrismaClient,
  TrimStatus,
  ColorType,
  ImageType,
  Model3dFormat,
  LodLevel,
} from '@prisma/client';
import { upsertTrim } from './utils/seeder.utils';

/**
 * Seeder COMPLEMENTARIO — Extra Trims, Specs, Colors & Images
 *
 * Extiende los trims existentes que quedaron sin specs (Atto 3, Tiggo 7 Pro E)
 * y añade especificaciones al trim BYD Seal U Premium.
 * También inserta colores, imágenes y un modelo 3D de prueba.
 *
 * NO duplica datos del seeder principal trims.seeder.ts
 */
export async function seedExtraTrimsAndSpecs(prisma: PrismaClient) {
  console.log('🔩  Seeding Extra Trims, Specs, Colors & 3D Models...');

  // ── Resolución de modelos existentes ──────────────────────────────────────
  const atto3 = await prisma.model.findUniqueOrThrow({
    where: { slug: 'byd-atto-3-2025' },
  });
  const tiggoE = await prisma.model.findUniqueOrThrow({
    where: { slug: 'chery-tiggo-7-pro-e-2025' },
  });
  const sealU = await prisma.model.findUniqueOrThrow({
    where: { slug: 'byd-seal-u-2025' },
  });

  // ── Trim BYD Atto 3 "Comfort" (nuevo trim con stock) ──────────────────────
  const atto3Comfort = await upsertTrim(prisma, atto3.id, 'Comfort', {
    modelId: atto3.id,
    name: 'Comfort',
    price: 133_900_000,
    availableQuantity: 2,
    status: TrimStatus.stock,
    active: true,
  });

  // Spec para Atto 3 Base (existente, sin spec)
  const atto3Base = await prisma.trim.findFirstOrThrow({
    where: { modelId: atto3.id, name: 'Base' },
  });

  await prisma.spec.upsert({
    where: { trimId: atto3Base.id },
    update: {},
    create: {
      trimId: atto3Base.id,
      batteryKwh: 60.48,
      rangeCltcKm: 480,
      rangeWltpKm: 380,
      horsepower: 204,
      torque: 310,
      zeroTo100: 7.3,
      topSpeed: 160,
      chargeTime3080: '28 min (88 kW DC)',
      trunkLiters: 440,
      lengthMm: 4455,
      widthMm: 1875,
      heightMm: 1615,
      wheelbaseMm: 2720,
      curbWeightKg: 1750,
      softwareVersion: 2,
      adasLevel: 2,
      screenSize: 12,
      kwhPer100km: 14.7,
    },
  });

  // Spec para Atto 3 Comfort (nuevo trim)
  await prisma.spec.upsert({
    where: { trimId: atto3Comfort.id },
    update: {},
    create: {
      trimId: atto3Comfort.id,
      batteryKwh: 60.48,
      rangeCltcKm: 480,
      rangeWltpKm: 380,
      horsepower: 204,
      torque: 310,
      zeroTo100: 7.3,
      topSpeed: 160,
      chargeTime3080: '28 min (88 kW DC)',
      trunkLiters: 440,
      lengthMm: 4455,
      widthMm: 1875,
      heightMm: 1615,
      wheelbaseMm: 2720,
      curbWeightKg: 1760,
      softwareVersion: 3,
      adasLevel: 2,
      screenSize: 15,
      kwhPer100km: 14.5,
    },
  });

  // ── Spec para Chery Tiggo 7 Pro E Base (existente, sin spec) ──────────────
  const tiggoBase = await prisma.trim.findFirstOrThrow({
    where: { modelId: tiggoE.id, name: 'Base' },
  });

  await prisma.spec.upsert({
    where: { trimId: tiggoBase.id },
    update: {},
    create: {
      trimId: tiggoBase.id,
      batteryKwh: 19.13,
      rangeCltcKm: 85,
      rangeWltpKm: 70,
      horsepower: 241, // PHEV combinado
      torque: 440,
      zeroTo100: 6.9,
      topSpeed: 185,
      chargeTime3080: '45 min (AC 7 kW)',
      trunkLiters: 228,
      lengthMm: 4500,
      widthMm: 1862,
      heightMm: 1746,
      wheelbaseMm: 2670,
      curbWeightKg: 1845,
      softwareVersion: 2,
      adasLevel: 1,
      screenSize: 10,
      kwhPer100km: 18.5,
    },
  });

  // ── Spec para BYD Seal U Premium (existente, sin spec) ────────────────────
  const sealUPremium = await prisma.trim.findFirstOrThrow({
    where: { modelId: sealU.id, name: 'Premium' },
  });

  await prisma.spec.upsert({
    where: { trimId: sealUPremium.id },
    update: {},
    create: {
      trimId: sealUPremium.id,
      batteryKwh: 87.0,
      rangeCltcKm: 600,
      rangeWltpKm: 500,
      horsepower: 313,
      torque: 430,
      zeroTo100: 5.9,
      topSpeed: 185,
      chargeTime3080: '25 min (150 kW DC)',
      trunkLiters: 440,
      lengthMm: 4785,
      widthMm: 1890,
      heightMm: 1668,
      wheelbaseMm: 2765,
      curbWeightKg: 2050,
      softwareVersion: 4,
      adasLevel: 3,
      screenSize: 15,
      kwhPer100km: 16.2,
    },
  });

  // ── Colores complementarios ────────────────────────────────────────────────
  await prisma.color.createMany({
    skipDuplicates: true,
    data: [
      // Atto 3 Base
      {
        trimId: atto3Base.id,
        name: 'Racing Red',
        hexCode: 'C0392B',
        type: ColorType.exterior,
        swatchUrl:
          'https://res.cloudinary.com/elemotor/image/upload/swatches/red.png',
      },
      {
        trimId: atto3Base.id,
        name: 'Glacier White',
        hexCode: 'F0F4F8',
        type: ColorType.exterior,
        swatchUrl:
          'https://res.cloudinary.com/elemotor/image/upload/swatches/white.png',
      },
      {
        trimId: atto3Base.id,
        name: 'Midnight Black',
        hexCode: '1C1C1E',
        type: ColorType.exterior,
      },
      {
        trimId: atto3Base.id,
        name: 'Beige Interior',
        hexCode: 'D2B48C',
        type: ColorType.interior,
      },
      // Atto 3 Comfort
      {
        trimId: atto3Comfort.id,
        name: 'Racing Red',
        hexCode: 'C0392B',
        type: ColorType.exterior,
        swatchUrl:
          'https://res.cloudinary.com/elemotor/image/upload/swatches/red.png',
      },
      {
        trimId: atto3Comfort.id,
        name: 'Glacier White',
        hexCode: 'F0F4F8',
        type: ColorType.exterior,
      },
      // Tiggo 7 Pro E
      {
        trimId: tiggoBase.id,
        name: 'Pearl Silver',
        hexCode: 'C0C0C0',
        type: ColorType.exterior,
        swatchUrl:
          'https://res.cloudinary.com/elemotor/image/upload/swatches/silver.png',
      },
      {
        trimId: tiggoBase.id,
        name: 'Stellar Black',
        hexCode: '2C2C2C',
        type: ColorType.exterior,
      },
      {
        trimId: tiggoBase.id,
        name: 'Black Interior',
        hexCode: '1A1A1A',
        type: ColorType.interior,
      },
      // Seal U Premium
      {
        trimId: sealUPremium.id,
        name: 'Cosmic Black',
        hexCode: '1A1A1A',
        type: ColorType.exterior,
        swatchUrl:
          'https://res.cloudinary.com/elemotor/image/upload/swatches/black.png',
      },
      {
        trimId: sealUPremium.id,
        name: 'Polar White',
        hexCode: 'F5F5F5',
        type: ColorType.exterior,
      },
      {
        trimId: sealUPremium.id,
        name: 'Steel Gray Interior',
        hexCode: '8A8A8A',
        type: ColorType.interior,
      },
    ],
  });

  // ── Imágenes complementarias ───────────────────────────────────────────────
  await prisma.image.createMany({
    skipDuplicates: true,
    data: [
      // Atto 3
      {
        trimId: atto3Base.id,
        url: 'https://res.cloudinary.com/elemotor/image/upload/models/atto3/hero.jpg',
        publicId: '',
        altText: 'BYD Atto 3 Base — Vista frontal',
        type: ImageType.hero,
        sortOrder: 0,
      },
      {
        trimId: atto3Base.id,
        url: 'https://res.cloudinary.com/elemotor/image/upload/models/atto3/exterior1.jpg',
        publicId: '',
        altText: 'BYD Atto 3 — Vista lateral',
        type: ImageType.exterior,
        sortOrder: 1,
      },
      {
        trimId: atto3Base.id,
        url: 'https://res.cloudinary.com/elemotor/image/upload/models/atto3/interior1.jpg',
        publicId: '',
        altText: 'BYD Atto 3 — Interior',
        type: ImageType.interior,
        sortOrder: 2,
      },
      {
        trimId: atto3Comfort.id,
        url: 'https://res.cloudinary.com/elemotor/image/upload/models/atto3/hero.jpg',
        publicId: '',
        altText: 'BYD Atto 3 Comfort — Vista frontal',
        type: ImageType.hero,
        sortOrder: 0,
      },
      // Tiggo 7 Pro E
      {
        trimId: tiggoBase.id,
        url: 'https://res.cloudinary.com/elemotor/image/upload/models/tiggo7e/hero.jpg',
        publicId: '',
        altText: 'Chery Tiggo 7 Pro E — Vista frontal',
        type: ImageType.hero,
        sortOrder: 0,
      },
      {
        trimId: tiggoBase.id,
        url: 'https://res.cloudinary.com/elemotor/image/upload/models/tiggo7e/gallery1.jpg',
        publicId: '',
        altText: 'Chery Tiggo 7 Pro E — Lateral',
        type: ImageType.gallery,
        sortOrder: 1,
      },
      {
        trimId: tiggoBase.id,
        url: 'https://res.cloudinary.com/elemotor/image/upload/models/tiggo7e/interior1.jpg',
        publicId: '',
        altText: 'Chery Tiggo 7 Pro E — Interior PHEV',
        type: ImageType.interior,
        sortOrder: 2,
      },
      // Seal U Premium
      {
        trimId: sealUPremium.id,
        url: 'https://res.cloudinary.com/elemotor/image/upload/models/seal-u/premium-hero.jpg',
        publicId: '',
        altText: 'BYD Seal U Premium — Vista frontal',
        type: ImageType.hero,
        sortOrder: 0,
      },
      {
        trimId: sealUPremium.id,
        url: 'https://res.cloudinary.com/elemotor/image/upload/models/seal-u/premium-panoramic.jpg',
        publicId: '',
        altText: 'BYD Seal U Premium — Vista 360°',
        type: ImageType.panoramic,
        sortOrder: 1,
      },
    ],
  });

  // ── Modelo 3D de prueba (Seal U Dynamic) ──────────────────────────────────
  const sealUDynamic = await prisma.trim.findFirstOrThrow({
    where: { modelId: sealU.id, name: 'Dynamic' },
  });

  const existing3d = await prisma.model3d.findFirst({
    where: { trimId: sealUDynamic.id },
  });

  if (!existing3d) {
    await prisma.model3d.create({
      data: {
        trimId: sealUDynamic.id,
        fileUrl:
          'https://res.cloudinary.com/elemotor/raw/upload/models/seal-u/seal-u-dynamic.glb',
        publicId: '',
        fileSizeMb: 24.5,
        format: Model3dFormat.glb,
        dracoCompressed: true,
        lodLevel: LodLevel.high,
      },
    });
  }

  console.log(
    '   ✅  Extra trims, specs, colors, images & 3D models insertados.',
  );
}
