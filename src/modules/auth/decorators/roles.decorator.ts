import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/** Clave de metadatos para los roles requeridos en un endpoint */
export const ROLES_KEY = 'roles';

/**
 * Decorador @Roles(...roles)
 *
 * Restringe el acceso a un endpoint a usuarios con el/los roles especificados.
 * Requiere que JwtAuthGuard se haya ejecutado primero (el usuario debe estar autenticado).
 *
 * @example
 * @Roles(UserRole.admin)
 * @Get('admin-only')
 * adminEndpoint() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
