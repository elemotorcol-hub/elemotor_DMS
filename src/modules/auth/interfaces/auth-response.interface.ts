import { UserRole } from '@prisma/client';

/**
 * Versión segura del usuario para incluir en respuestas de API.
 * Nunca expone passwordHash ni tokens internos.
 */
export interface ISafeUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}

/**
 * Respuesta estándar de autenticación (register, login, OAuth, OTP verify).
 */
export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: ISafeUser;
}

/**
 * Respuesta cuando solo se entrega un nuevo access token (refresh).
 */
export interface IRefreshResponse {
  accessToken: string;
}
