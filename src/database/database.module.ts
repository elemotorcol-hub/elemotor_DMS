import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * DatabaseModule
 * Configura la conexión TypeORM con MySQL usando variables de entorno.
 * - autoLoadEntities: carga automáticamente las entidades registradas en cada módulo
 * - synchronize: SOLO habilitado en desarrollo (sincroniza schema con la BD)
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        autoLoadEntities: true,
        synchronize: process.env.NODE_ENV !== 'production', // ⚠️ Deshabilitar en producción
        logging: process.env.NODE_ENV !== 'production',
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
