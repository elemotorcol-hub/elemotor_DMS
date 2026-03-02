import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ITokenPayload } from '../interfaces/token-payload.interface';

/**
 * RolesGuard — Guard global para control de acceso basado en roles (RBAC).
 *
 * - Si el endpoint no tiene @Roles(), permite el acceso (cualquier auth user).
 * - Si tiene @Roles(), verifica que el rol del usuario en el JWT coincida.
 * - Debe ejecutarse después de JwtAuthGuard (req.user ya debe existir).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Sin restricción de roles → acceso libre para cualquier usuario autenticado
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user?: ITokenPayload }>();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'No tienes permisos suficientes para acceder a este recurso',
      );
    }

    return true;
  }
}
