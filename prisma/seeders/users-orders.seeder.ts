import { PrismaClient, UserRole, OrderStatus, QuoteStatus, PreferredChannel } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { getAdminPasswordHash } from './utils/seeder.utils';

export async function seedUsersAndOrders(prisma: PrismaClient) {
  console.log('👤  Seeding Users, Orders & Quotes...');

  // Users
  const adminPassword = await getAdminPasswordHash();
  
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@elemotor.co' },
    update: {},
    create: {
      name: 'Administrador Elemotor',
      email: 'admin@elemotor.co',
      phone: '+573001234567',
      passwordHash: adminPassword,
      cedula: '1000000001',
      city: 'Bogotá',
      role: UserRole.admin,
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: 'cliente@ejemplo.co' },
    update: {},
    create: {
      name: 'Juan Pérez',
      email: 'cliente@ejemplo.co',
      phone: '+573109876543',
      cedula: '1023456789',
      city: 'Medellín',
      role: UserRole.client,
    },
  });

  // Dependencies for Orders/Quotes
  const sealU = await prisma.model.findUniqueOrThrow({ where: { slug: 'byd-seal-u-2025' } });
  const sealUDynamic = await prisma.trim.findFirstOrThrow({ where: { modelId: sealU.id, name: 'Dynamic' } });
  const sealUPremium = await prisma.trim.findFirstOrThrow({ where: { modelId: sealU.id, name: 'Premium' } });
  const cosmicBlack = await prisma.color.findFirstOrThrow({ where: { trimId: sealUDynamic.id, name: 'Cosmic Black' } });

  // Order
  const demoOrder = await prisma.order.upsert({
    where: { trackingCode: 'ELE-2025-00001' },
    update: {},
    create: {
      userId: clientUser.id,
      trimId: sealUDynamic.id,
      colorId: cosmicBlack.id,
      trackingCode: 'ELE-2025-00001',
      status: OrderStatus.confirmed,
      estimatedDelivery: new Date('2025-06-30'),
    },
  });

  const historyExists = await prisma.orderStatusHistory.findFirst({ where: { orderId: demoOrder.id } });
  if (!historyExists) {
    await prisma.orderStatusHistory.create({
      data: {
        orderId: demoOrder.id,
        status: OrderStatus.confirmed,
        description: 'Pedido confirmado. Pago recibido exitosamente.',
        date: new Date(),
        updatedById: adminUser.id,
      },
    });
  }

  // Quote
  await prisma.quote.upsert({
    where: { referenceCode: 'COT-2025-00001' },
    update: {},
    create: {
      userId: clientUser.id,
      name: 'Juan Pérez',
      email: 'cliente@ejemplo.co',
      phone: '+573109876543',
      city: 'Medellín',
      modelId: sealU.id,
      trimId: sealUPremium.id,
      budgetRange: 180_000_000,
      preferredChannel: PreferredChannel.whatsapp,
      message: 'Me interesa el BYD Seal U Premium. ¿Tienen disponibilidad para Junio 2025?',
      referenceCode: 'COT-2025-00001',
      status: QuoteStatus.pending,
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'byd-seal-u-2025',
    },
  });
}
