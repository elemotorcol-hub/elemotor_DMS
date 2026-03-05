import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';

// ── Catálogo / Inventario ────────────────────────────────────────
import { BrandsModule } from './modules/brands/brands.module';
import { ModelsModule } from './modules/models/models.module';
import { TrimsModule } from './modules/trims/trims.module';
import { SpecsModule } from './modules/specs/specs.module';
import { ColorsModule } from './modules/colors/colors.module';
import { ImagesModule } from './modules/images/images.module';
import { UploadModule } from './modules/upload/upload.module';
import { Models3dModule } from './modules/models-3d/models-3d.module';
import { OrdersModule } from './modules/orders/orders.module';
import { QuotesModule } from './modules/quotes/quotes.module';

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
 * - ImagesModule:    CRUD /api/images (con upload Cloudinary)
 * - Models3dModule:  POST/DELETE /api/models-3d (modelos GLB)
 * - UploadModule:    POST /api/upload/image | /api/upload/file (Cloudinary)
 * - OrdersModule:   CRUD /api/orders (pedidos de importación)
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

    // Autenticación — JWT, OAuth, OTP, Guards
    AuthModule,

    // Catálogo — Inventario
    BrandsModule,
    ModelsModule,
    TrimsModule,
    SpecsModule,
    ColorsModule,
    ImagesModule,
    UploadModule,
    Models3dModule,

    // Pedidos de importación
    OrdersModule,

    // Cotizaciones / Leads
    QuotesModule,
  ],
  providers: [
    // Guards globales: JwtAuthGuard + RolesGuard aplicados a TODOS los endpoints
    // Los endpoints públicos usan el decorador @Public() para omitirlos
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
