import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JwtAuthGuard — Guard global de autenticación JWT.
 *
 * - Omite la validación si el endpoint está marcado con @Public().
 * - Para todos los demás endpoints, exige un Bearer token válido.
 * - Se registra globalmente en AppModule vía APP_GUARD.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Rutas marcadas con @Public() pasan sin validar el token
    if (isPublic) return true;

    return super.canActivate(context);
  }
}
