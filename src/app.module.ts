import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';

/**
 * AppModule — Módulo raíz de la aplicación
 *
 * Integra:
 * - ConfigModule:  Carga variables de entorno globalmente
 * - PrismaModule:  Conexión a MySQL vía Prisma ORM (global)
 * - HealthModule:  Endpoint GET /health
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

    // Módulos de la aplicación
    HealthModule,
  ],
})
export class AppModule {}
