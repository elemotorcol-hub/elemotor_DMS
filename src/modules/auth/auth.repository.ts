import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * AuthRepository — Capa de acceso a datos para el módulo de autenticación.
 *
 * Encapsula todas las operaciones de Prisma relacionadas con el modelo User
 * en el contexto de autenticación, manteniendo el servicio libre de detalles ORM.
 */
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Busca un usuario por su email (para login/registro) */
  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** Busca un usuario por su ID */
  findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /** Busca un usuario por su Google ID (para OAuth) */
  findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { googleId } });
  }

  /** Busca un usuario por número de teléfono (para OTP) */
  findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { phone } });
  }

  /** Crea un nuevo usuario */
  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  /** Actualiza el refresh token hasheado del usuario (o lo elimina en logout) */
  updateRefreshToken(id: number, refreshToken: string | null): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { refreshToken },
    });
  }

  /** Guarda el código OTP y su fecha de expiración */
  saveOtp(id: number, otpCode: string, otpExpiresAt: Date): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { otpCode, otpExpiresAt },
    });
  }

  /** Limpia el OTP después de su uso o expiración */
  clearOtp(id: number): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { otpCode: null, otpExpiresAt: null },
    });
  }

  /** Guarda el token de reset de contraseña y su expiración */
  savePasswordResetToken(
    id: number,
    token: string,
    expires: Date,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });
  }

  /** Busca un usuario por su token de reset de contraseña */
  findByResetToken(token: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { passwordResetToken: token },
    });
  }

  /** Actualiza la contraseña e invalida el token de reset */
  updatePassword(id: number, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }

  /** Actualiza campos de usuario (usado en upsert de Google OAuth) */
  update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }
}
