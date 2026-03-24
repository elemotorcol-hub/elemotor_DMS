import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
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
    // We let passport run canActivate to extract the user
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si es pública y no hay usuario válido, retornamos `true` para no bloquear
    // passport asignará req.user = true, por lo que req.user?.sub será undefined y no fallará.
    if (isPublic && !user) {
      return true;
    }

    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    return user;
  }
}

