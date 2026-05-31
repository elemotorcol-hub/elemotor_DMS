import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ITokenPayload } from '../interfaces/token-payload.interface';

/**
 * JwtStrategy — Estrategia Passport para validar Bearer tokens JWT.
 *
 * Extrae el token del header Authorization: Bearer <token>.
 * El payload validado queda disponible en req.user en cualquier endpoint protegido.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') as string,
    });
  }

  /**
   * Invocado por Passport tras verificar la firma del token.
   * El objeto retornado se asigna a req.user.
   */
  validate(payload: ITokenPayload): ITokenPayload {
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
