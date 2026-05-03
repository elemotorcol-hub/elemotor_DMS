import { Injectable } from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryUsersDto } from './dto/query-users.dto';

export const ADMIN_LIST_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  city: true,
  role: true,
  emailVerifiedAt: true,
  createdAt: true,
} as const;

export type AdminUserPayload = Prisma.UserGetPayload<{ select: typeof ADMIN_LIST_SELECT }>;

/**
 * UsersRepository — Capa de acceso a datos para el módulo de usuarios.
 *
 * Encapsula las operaciones Prisma relacionadas con el modelo User:
 * perfil, listado admin y cambio de rol.
 */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Perfil ───────────────────────────────────────────────────────────────

  /** Obtiene un usuario por su ID */
  findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /** Obtiene un usuario por su Email */
  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** Crea un nuevo usuario con rol de cliente (para vinculación automática) */
  async createClient(data: { name: string; email: string; phone?: string; city?: string }) {
    return this.prisma.user.create({
      data: {
        ...data,
        role: UserRole.client,
      },
    });
  }

  /** Crea un usuario empleado desde el panel admin */
  async createEmployee(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  /** Actualiza campos editables del perfil (name, phone, city, avatarUrl) */
  update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  /**
   * Actualiza la contraseña e invalida el refresh token
   * (fuerza re-login en todos los dispositivos).
   */
  updatePassword(id: number, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash, refreshToken: null },
    });
  }

  // ─── Admin: listado ───────────────────────────────────────────────────────

  /**
   * Lista usuarios con filtros opcionales (role, search), paginación y orden.
   */
  findMany(query: QueryUsersDto): Promise<AdminUserPayload[]> {
    const { page = 1, limit = 10, role, search } = query;
    const skip = (page - 1) * limit;

    const where = this.buildWhere(role, search);

    return this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: ADMIN_LIST_SELECT,
    });
  }

  /** Conteo total para paginación */
  count(query: QueryUsersDto): Promise<number> {
    const { role, search } = query;
    return this.prisma.user.count({ where: this.buildWhere(role, search) });
  }

  // ─── Admin: cambio de rol ─────────────────────────────────────────────────

  /** Actualiza el rol de un usuario */
  updateRole(id: number, role: UserRole): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  /** Cuenta cuántos super_admins existen (para proteger el último) */
  countSuperAdmins(): Promise<number> {
    return this.prisma.user.count({ where: { role: UserRole.super_admin } });
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────

  private buildWhere(
    role?: UserRole,
    search?: string,
  ): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    return where;
  }
}
