import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { TestDbModule } from './modules/test-db/test-db.module';

/**
 * AppModule — Módulo raíz de la aplicación
 *
 * Integra:
 * - ConfigModule: Carga variables de entorno globalmente
 * - DatabaseModule: Configuración TypeORM + MySQL
 * - TestDbModule: Endpoint de prueba de conexión
 */
@Module({
  imports: [
    // Configuración de variables de entorno (disponible globalmente)
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),

    // Conexión a la base de datos MySQL via TypeORM
    DatabaseModule,

    // Módulos de la aplicación
    HealthModule,
    TestDbModule,
  ],
})
export class AppModule {}
