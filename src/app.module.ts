import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';

// ── Catálogo / Inventario ────────────────────────────────────────
import { BrandsModule } from './modules/brands/brands.module';
import { ModelsModule } from './modules/models/models.module';
import { TrimsModule } from './modules/trims/trims.module';
import { SpecsModule } from './modules/specs/specs.module';
import { ColorsModule } from './modules/colors/colors.module';
import { ImagesModule } from './modules/images/images.module';

/**
 * AppModule — Módulo raíz de la aplicación
 *
 * Integra:
 * - ConfigModule:  Carga variables de entorno globalmente
 * - PrismaModule:  Conexión a MySQL vía Prisma ORM (global)
 * - HealthModule:  Endpoint GET /health
 * - BrandsModule:  CRUD /api/brands
 * - ModelsModule:  CRUD /api/models
 * - TrimsModule:   CRUD /api/trims
 * - SpecsModule:   CRUD /api/specs
 * - ColorsModule:  CRUD /api/colors
 * - ImagesModule:  CRUD /api/images
 */
@Module({
  imports: [
    // Variables de entorno disponibles globalmente en toda la app
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),

    // Conexión Prisma + MySQL (disponible globalmente sin importar en cada módulo)
    PrismaModule,

    // Infraestructura
    HealthModule,

    // Catálogo — Inventario
    BrandsModule,
    ModelsModule,
    TrimsModule,
    SpecsModule,
    ColorsModule,
    ImagesModule,
  ],
})
export class AppModule {}
