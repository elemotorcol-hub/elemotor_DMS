import { PrismaClient, ServiceType } from '@prisma/client';

/**
 * Seeder COMPLEMENTARIO — Talleres adicionales
 *
 * Agrega 4 talleres más (Medellín, Cali, Barranquilla, Bucaramanga)
 * con servicios, horarios semanales completos e imágenes.
 *
 * El taller de Bogotá ya existe en workshops.seeder.ts → no se duplica.
 */
export async function seedExtraWorkshops(prisma: PrismaClient) {
  console.log('🏗️  Seeding Extra Workshops...');

  interface WorkshopSeedData {
    name: string;
    address: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    phone: string;
    whatsapp: string;
    email: string;
    googleMapsUrl: string;
    rating: number;
    services: ServiceType[];
    images: { url: string; altText: string; sortOrder: number }[];
  }

  const workshops: WorkshopSeedData[] = [
    {
      name: 'Centro de Servicio Elemotor Medellín',
      address: 'Cra. 43A #18-111, El Poblado',
      city: 'Medellín',
      state: 'Antioquia',
      latitude: 6.20868,
      longitude: -75.56892,
      phone: '+5744441234',
      whatsapp: '+573204567890',
      email: 'medellin@elemotor.co',
      googleMapsUrl: 'https://maps.google.com/?q=6.20868,-75.56892',
      rating: 4.9,
      services: [
        ServiceType.maintenance,
        ServiceType.chargers,
        ServiceType.electric_diagnostics,
        ServiceType.tires,
      ],
      images: [
        {
          url: 'https://res.cloudinary.com/elemotor/image/upload/workshops/medellin/facade.jpg',
          altText: 'Fachada Centro de Servicio Medellín',
          sortOrder: 0,
        },
        {
          url: 'https://res.cloudinary.com/elemotor/image/upload/workshops/medellin/interior.jpg',
          altText: 'Área de servicio Medellín',
          sortOrder: 1,
        },
      ],
    },
    {
      name: 'Centro de Servicio Elemotor Cali',
      address: 'Av. 6N #28-35, Granada',
      city: 'Cali',
      state: 'Valle del Cauca',
      latitude: 3.45082,
      longitude: -76.53209,
      phone: '+5724443456',
      whatsapp: '+573208765432',
      email: 'cali@elemotor.co',
      googleMapsUrl: 'https://maps.google.com/?q=3.45082,-76.53209',
      rating: 4.7,
      services: [
        ServiceType.maintenance,
        ServiceType.electric_diagnostics,
        ServiceType.body_paint,
      ],
      images: [
        {
          url: 'https://res.cloudinary.com/elemotor/image/upload/workshops/cali/facade.jpg',
          altText: 'Fachada Centro de Servicio Cali',
          sortOrder: 0,
        },
        {
          url: 'https://res.cloudinary.com/elemotor/image/upload/workshops/cali/charging-zone.jpg',
          altText: 'Zona de carga rápida Cali',
          sortOrder: 1,
        },
      ],
    },
    {
      name: 'Centro de Servicio Elemotor Barranquilla',
      address: 'Cra. 46 #76-102, El Golf',
      city: 'Barranquilla',
      state: 'Atlántico',
      latitude: 10.9793,
      longitude: -74.8116,
      phone: '+5755557890',
      whatsapp: '+573155556677',
      email: 'barranquilla@elemotor.co',
      googleMapsUrl: 'https://maps.google.com/?q=10.9793,-74.8116',
      rating: 4.6,
      services: [ServiceType.maintenance, ServiceType.chargers, ServiceType.tires],
      images: [
        {
          url: 'https://res.cloudinary.com/elemotor/image/upload/workshops/barranquilla/facade.jpg',
          altText: 'Fachada Centro de Servicio Barranquilla',
          sortOrder: 0,
        },
      ],
    },
    {
      name: 'Centro de Servicio Elemotor Bucaramanga',
      address: 'Cll. 48 #31-53, Cabecera del Llano',
      city: 'Bucaramanga',
      state: 'Santander',
      latitude: 7.10572,
      longitude: -73.10377,
      phone: '+5777664321',
      whatsapp: '+573163334455',
      email: 'bucaramanga@elemotor.co',
      googleMapsUrl: 'https://maps.google.com/?q=7.10572,-73.10377',
      rating: 4.5,
      services: [ServiceType.maintenance, ServiceType.electric_diagnostics],
      images: [
        {
          url: 'https://res.cloudinary.com/elemotor/image/upload/workshops/bucaramanga/facade.jpg',
          altText: 'Fachada Centro de Servicio Bucaramanga',
          sortOrder: 0,
        },
      ],
    },
  ];

  await Promise.all(
    workshops.map(async (ws) => {
      // Idempotente: verificar por nombre y ciudad
      const existingWorkshop = await prisma.workshop.findFirst({
        where: { name: ws.name, city: ws.city },
      });

      if (!existingWorkshop) {
        const newWorkshop = await prisma.workshop.create({
          data: {
            name: ws.name,
            address: ws.address,
            city: ws.city,
            state: ws.state,
            latitude: ws.latitude,
            longitude: ws.longitude,
            phone: ws.phone,
            whatsapp: ws.whatsapp,
            email: ws.email,
            googleMapsUrl: ws.googleMapsUrl,
            rating: ws.rating,
            active: true,
          },
        });

        // Servicios
        await prisma.workshopService.createMany({
          data: ws.services.map((serviceType) => ({
            workshopId: newWorkshop.id,
            serviceType,
          })),
        });

        // Horarios semana completa (L–S abierto, D cerrado)
        await prisma.workshopHour.createMany({
          data: [
            { workshopId: newWorkshop.id, dayOfWeek: 1, openTime: '08:00', closeTime: '18:00', isClosed: false },
            { workshopId: newWorkshop.id, dayOfWeek: 2, openTime: '08:00', closeTime: '18:00', isClosed: false },
            { workshopId: newWorkshop.id, dayOfWeek: 3, openTime: '08:00', closeTime: '18:00', isClosed: false },
            { workshopId: newWorkshop.id, dayOfWeek: 4, openTime: '08:00', closeTime: '18:00', isClosed: false },
            { workshopId: newWorkshop.id, dayOfWeek: 5, openTime: '08:00', closeTime: '18:00', isClosed: false },
            { workshopId: newWorkshop.id, dayOfWeek: 6, openTime: '09:00', closeTime: '14:00', isClosed: false },
            { workshopId: newWorkshop.id, dayOfWeek: 0, openTime: null,    closeTime: null,    isClosed: true  },
          ],
        });

        // Imágenes
        if (ws.images.length > 0) {
          await prisma.workshopImage.createMany({
            data: ws.images.map((img) => ({
              workshopId: newWorkshop.id,
              url: img.url,
              altText: img.altText,
              sortOrder: img.sortOrder,
            })),
          });
        }

        console.log(`   🏢  Taller "${ws.name}" en ${ws.city} creado.`);
      } else {
        console.log(`   ⏭️  Taller "${ws.name}" en ${ws.city} ya existe, omitiendo.`);
      }
    })
  );

  console.log('   ✅  Talleres adicionales procesados.');
}
