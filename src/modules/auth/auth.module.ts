import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * AuthModule — Módulo de autenticación.
 *
 * Incluye:
 * - PassportModule: estrategias de autenticación
 * - JwtModule: firma y verificación de tokens JWT
 * - ThrottlerModule: rate limiting específico para login (5 req/min)
 * - JwtStrategy: validación de Bearer tokens
 */
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JwtModule configurado desde variables de entorno
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: (config.get<string>('jwt.expiresIn') ?? '15m') as `${number}${'s'|'m'|'h'|'d'}`,
        },
      }),
    }),

    // ThrottlerModule local para el guard de login (5 intentos/min)
    ThrottlerModule.forRoot([
      {
        name: 'login',
        ttl: 60_000, // 1 minuto en ms
        limit: 5,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    { provide: 'IAuthService', useClass: AuthService },
    AuthService,
    AuthRepository,
    JwtStrategy,
  ],
  exports: [AuthService, 'IAuthService', JwtModule, PassportModule],
})
export class AuthModule {}
