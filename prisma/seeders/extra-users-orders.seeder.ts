import {
  PrismaClient,
  UserRole,
  OrderStatus,
  QuoteStatus,
  PreferredChannel,
  DocumentType,
  UploadedBy,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { getAdminPasswordHash } from './utils/seeder.utils';

/**
 * Seeder COMPLEMENTARIO — Usuarios extra, 2do pedido y más cotizaciones
 *
 * Agrega:
 *  - Usuario admin con email admin@elemotor.com.co (solicitado en el brief)
 *  - 2o usuario cliente de prueba (Maria García, Cali)
 *  - 2o pedido con historial completo de estados (confirmed → transit → ready)
 *  - Documento de factura asociado al 2o pedido
 *  - 3 cotizaciones adicionales con distintos estados y canales
 *
 * NO duplica usuarios ni órdenes del seeder original users-orders.seeder.ts
 */
export async function seedExtraUsersOrdersAndQuotes(prisma: PrismaClient) {
  console.log('👥  Seeding Extra Users, Orders & Quotes...');

  const adminPasswordHash = await getAdminPasswordHash();
  const clientPasswordHash = await bcrypt.hash('Cliente2025!', 10);

  // ── Usuario admin adicional (email .com.co solicitado) ────────────────────
  const adminCo = await prisma.user.upsert({
    where: { email: 'admin@elemotor.com.co' },
    update: {},
    create: {
      name: 'Administrador Principal',
      email: 'admin@elemotor.com.co',
      phone: '+573001112233',
      passwordHash: adminPasswordHash,
      cedula: '1000000002',
      city: 'Bogotá',
      role: UserRole.admin,
    },
  });

  // ── Segundo cliente de prueba ─────────────────────────────────────────────
  const clientUser2 = await prisma.user.upsert({
    where: { email: 'maria.garcia@ejemplo.co' },
    update: {},
    create: {
      name: 'María García',
      email: 'maria.garcia@ejemplo.co',
      phone: '+573209998877',
      passwordHash: clientPasswordHash,
      cedula: '1045678901',
      city: 'Cali',
      role: UserRole.client,
    },
  });

  // ── Referencias a inventario existente ────────────────────────────────────
  const dolphin = await prisma.model.findUniqueOrThrow({
    where: { slug: 'byd-dolphin-2025' },
  });
  const dolphinStd = await prisma.trim.findFirstOrThrow({
    where: { modelId: dolphin.id, name: 'Standard Range' },
  });
  const skyBlue = await prisma.color.findFirstOrThrow({
    where: { trimId: dolphinStd.id, name: 'Sky Blue' },
  });

  const sealU = await prisma.model.findUniqueOrThrow({
    where: { slug: 'byd-seal-u-2025' },
  });
  const sealUPremium = await prisma.trim.findFirstOrThrow({
    where: { modelId: sealU.id, name: 'Premium' },
  });

  const atto3 = await prisma.model.findUniqueOrThrow({
    where: { slug: 'byd-atto-3-2025' },
  });
  const atto3Base = await prisma.trim.findFirstOrThrow({
    where: { modelId: atto3.id, name: 'Base' },
  });

  // Reutilizamos el primer cliente del seeder original para el 2do pedido
  const clientUser1 = await prisma.user.findUniqueOrThrow({
    where: { email: 'cliente@ejemplo.co' },
  });

  // ── Segundo pedido (María García / BYD Dolphin / estado: ready) ───────────
  const order2 = await prisma.order.upsert({
    where: { trackingCode: 'ELE-2025-00002' },
    update: {},
    create: {
      userId: clientUser2.id,
      trimId: dolphinStd.id,
      colorId: skyBlue.id,
      trackingCode: 'ELE-2025-00002',
      status: OrderStatus.ready,
      estimatedDelivery: new Date('2025-05-15'),
      vin: 'LGXCE4019PA000002',
    },
  });

  // Historial de estados del 2do pedido solo si no existe
  const historyCount2 = await prisma.orderStatusHistory.count({
    where: { orderId: order2.id },
  });

  if (historyCount2 === 0) {
    await prisma.orderStatusHistory.createMany({
      data: [
        {
          orderId: order2.id,
          status: OrderStatus.confirmed,
          description: 'Pedido confirmado tras recibo de pago inicial.',
          date: new Date('2025-02-01T09:00:00Z'),
          updatedById: adminCo.id,
        },
        {
          orderId: order2.id,
          status: OrderStatus.port_origin,
          description: 'Vehículo registrado en puerto de Shenzhen, China.',
          date: new Date('2025-02-10T11:30:00Z'),
          updatedById: adminCo.id,
        },
        {
          orderId: order2.id,
          status: OrderStatus.transit,
          description: 'Embarcado en buque EleMOTOR Express. ETA Cartagena: 28 Feb.',
          date: new Date('2025-02-14T08:00:00Z'),
          updatedById: adminCo.id,
        },
        {
          orderId: order2.id,
          status: OrderStatus.customs,
          description: 'Vehículo en proceso de inspección aduanera en Cartagena.',
          date: new Date('2025-02-28T14:00:00Z'),
          updatedById: adminCo.id,
        },
        {
          orderId: order2.id,
          status: OrderStatus.nationalization,
          description: 'Documentos de nacionalización aprobados por la DIAN.',
          date: new Date('2025-03-05T10:00:00Z'),
          updatedById: adminCo.id,
        },
        {
          orderId: order2.id,
          status: OrderStatus.ready,
          description:
            'Vehículo listo para entrega en concesionario Elemotor Cali.',
          date: new Date('2025-03-10T16:00:00Z'),
          updatedById: adminCo.id,
        },
      ],
    });
  }

  // ── Documento de prueba asociado al 2do pedido ────────────────────────────
  const docExists = await prisma.document.findFirst({
    where: { orderId: order2.id },
  });

  if (!docExists) {
    await prisma.document.create({
      data: {
        orderId: order2.id,
        userId: clientUser2.id,
        type: DocumentType.invoice,
        name: 'Factura BYD Dolphin - ELE-2025-00002',
        fileUrl:
          'https://res.cloudinary.com/elemotor/raw/upload/documents/factura-ele-2025-00002.pdf',
        uploadedBy: UploadedBy.admin,
      },
    });
  }

  // ── Cotizaciones adicionales (3 en distintos estados y canales) ───────────
  await prisma.quote.upsert({
    where: { referenceCode: 'COT-2025-00002' },
    update: {},
    create: {
      userId: clientUser2.id,
      name: 'María García',
      email: 'maria.garcia@ejemplo.co',
      phone: '+573209998877',
      city: 'Cali',
      modelId: dolphin.id,
      trimId: dolphinStd.id,
      budgetRange: 110_000_000,
      preferredChannel: PreferredChannel.email,
      message:
        'Estoy interesada en el BYD Dolphin Standard. ¿Cuál es el tiempo de entrega?',
      referenceCode: 'COT-2025-00002',
      status: QuoteStatus.responded,
      utmSource: 'instagram',
      utmMedium: 'social',
      utmCampaign: 'dolphin-launch-2025',
    },
  });

  await prisma.quote.upsert({
    where: { referenceCode: 'COT-2025-00003' },
    update: {},
    create: {
      userId: clientUser1.id,
      name: 'Juan Pérez',
      email: 'cliente@ejemplo.co',
      phone: '+573109876543',
      city: 'Medellín',
      modelId: atto3.id,
      trimId: atto3Base.id,
      budgetRange: 145_000_000,
      preferredChannel: PreferredChannel.call,
      message:
        'Me gustaría conocer más sobre el BYD Atto 3. ¿Tienen servicio post-venta en Medellín?',
      referenceCode: 'COT-2025-00003',
      status: QuoteStatus.closed_won,
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'atto3-medellin-2025',
    },
  });

  // Cotización anónima (sin usuario registrado)
  await prisma.quote.upsert({
    where: { referenceCode: 'COT-2025-00004' },
    update: {},
    create: {
      userId: null,
      name: 'Carlos Ramírez',
      email: 'carlos.ramirez@gmail.com',
      phone: '+573156667788',
      city: 'Barranquilla',
      modelId: sealU.id,
      trimId: sealUPremium.id,
      budgetRange: 200_000_000,
      preferredChannel: PreferredChannel.whatsapp,
      message:
        'Me interesa el BYD Seal U Premium en color negro. ¿Tienen opciones de financiamiento?',
      referenceCode: 'COT-2025-00004',
      status: QuoteStatus.pending,
      utmSource: 'facebook',
      utmMedium: 'paid_social',
      utmCampaign: 'seal-u-premium-q1-2025',
    },
  });

  // Cotización pendiente sin modelo específico
  await prisma.quote.upsert({
    where: { referenceCode: 'COT-2025-00005' },
    update: {},
    create: {
      userId: null,
      name: 'Sofía Montoya',
      email: 'sofia.montoya@hotmail.com',
      phone: '+573177889900',
      city: 'Pereira',
      modelId: null,
      trimId: null,
      budgetRange: 100_000_000,
      preferredChannel: PreferredChannel.whatsapp,
      message:
        'Busco un eléctrico para uso urbano en Pereira, con buen rango y bajo costo de mantenimiento.',
      referenceCode: 'COT-2025-00005',
      status: QuoteStatus.pending,
      utmSource: 'organic',
      utmMedium: null,
      utmCampaign: null,
    },
  });

  console.log(
    '   ✅  Usuarios extra, 2do pedido con historial, documento y cotizaciones insertados.',
  );
}
