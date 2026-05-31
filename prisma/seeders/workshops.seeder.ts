import { PrismaClient, ServiceType } from '@prisma/client';

export async function seedWorkshops(prisma: PrismaClient) {
  console.log('🔧  Seeding Workshops & Services...');

  let workshop1 = await prisma.workshop.findFirst({
    where: { name: 'Centro de Servicio Elemotor Bogotá', city: 'Bogotá' },
  });

  if (!workshop1) {
    workshop1 = await prisma.workshop.create({
      data: {
        name: 'Centro de Servicio Elemotor Bogotá',
        address: 'Av. Calle 26 #68D-35',
        city: 'Bogotá',
        state: 'Cundinamarca',
        latitude: 4.65609,
        longitude: -74.10402,
        phone: '+5716001234',
        whatsapp: '+573201234567',
        email: 'bogota@elemotor.co',
        googleMapsUrl: 'https://maps.google.com/?q=4.65609,-74.10402',
        rating: 4.8,
        active: true,
      },
    });

    await prisma.$transaction([
      prisma.workshopService.createMany({
        data: [
          { workshopId: workshop1.id, serviceType: ServiceType.maintenance },
          { workshopId: workshop1.id, serviceType: ServiceType.chargers },
          { workshopId: workshop1.id, serviceType: ServiceType.electric_diagnostics },
        ],
      }),
      prisma.workshopHour.createMany({
        data: [
          { workshopId: workshop1.id, dayOfWeek: 1, openTime: '08:00', closeTime: '18:00', isClosed: false },
          { workshopId: workshop1.id, dayOfWeek: 2, openTime: '08:00', closeTime: '18:00', isClosed: false },
          { workshopId: workshop1.id, dayOfWeek: 3, openTime: '08:00', closeTime: '18:00', isClosed: false },
          { workshopId: workshop1.id, dayOfWeek: 4, openTime: '08:00', closeTime: '18:00', isClosed: false },
          { workshopId: workshop1.id, dayOfWeek: 5, openTime: '08:00', closeTime: '18:00', isClosed: false },
          { workshopId: workshop1.id, dayOfWeek: 6, openTime: '09:00', closeTime: '13:00', isClosed: false },
          { workshopId: workshop1.id, dayOfWeek: 0, openTime: null,    closeTime: null,    isClosed: true  },
        ],
      })
    ]);
  }
}
