import { UserRole } from '@prisma/client';

/**
 * Payload embebido en el JWT access token.
 * Contiene solo la información mínima necesaria para autorización.
 */
export interface ITokenPayload {
  /** ID del usuario en la base de datos */
  sub: number;
  /** Email del usuario */
  email: string;
  /** Rol del usuario para control de acceso por roles */
  role: UserRole;
}
