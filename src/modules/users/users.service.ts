import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, UserRole } from '@prisma/client';

import { UsersRepository, ADMIN_LIST_SELECT } from './users.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

/** Número de rounds de bcrypt — consistente con AuthService */
const BCRYPT_SALT_ROUNDS = 12;

/** Campos públicos del perfil (sin datos sensibles de auth) */
const PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  city: true,
  avatarUrl: true,
  role: true,
  emailVerifiedAt: true,
  createdAt: true,
} as const;

export type AdminUserPayload = Prisma.UserGetPayload<{ select: typeof ADMIN_LIST_SELECT }>;

/**
 * UsersService — Lógica de negocio del módulo de usuarios.
 *
 * Cubre:
 * - Perfil propio (GET, UPDATE, cambio de contraseña)
 * - Listado admin con paginación y filtros
 * - Cambio de rol por super_admin
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  // ─── Perfil propio ────────────────────────────────────────────────────────

  /**
   * getProfile — Retorna el perfil del usuario autenticado (sin datos sensibles).
   */
  async getProfile(userId: number) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Retornar solo los campos seguros
    return Object.fromEntries(
      Object.keys(PROFILE_SELECT).map((key) => [key, user[key as keyof typeof user]]),
    );
  }

  /**
   * updateProfile — Actualiza name, phone, city y/o avatarUrl.
   * Previene modificación de campos sensibles (email, role, password, etc.).
   * Incluye escape temprano (early return) si el payload está vacío.
   */
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    if (Object.keys(dto).length === 0) {
      // Escape temprano para evitar un UPDATE inútil a BD
      return this.getProfile(userId);
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const updated = await this.usersRepository.update(userId, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.city !== undefined && { city: dto.city }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
    });

    return Object.fromEntries(
      Object.keys(PROFILE_SELECT).map((key) => [key, updated[key as keyof typeof updated]]),
    );
  }

  /**
   * changePassword — Verifica la contraseña actual, hashea la nueva e invalida
   * el refresh token (fuerza re-login en todos los dispositivos).
   */
  async changePassword(userId: number, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Usuarios OAuth (sin password) no pueden usar este endpoint
    if (!user.passwordHash) {
      throw new BadRequestException(
        'Tu cuenta está vinculada con Google. Usa el proveedor de OAuth para gestionar tu contraseña.',
      );
    }

    const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_SALT_ROUNDS);
    await this.usersRepository.updatePassword(userId, newHash);

    this.logger.log(`User #${userId} changed their password successfully`);
    return { message: 'Contraseña actualizada exitosamente. Por favor inicia sesión nuevamente.' };
  }

  // ─── Admin: listado ───────────────────────────────────────────────────────

  /**
   * findAll — Lista usuarios con paginación y filtros.
   * Optimizado: el Repository ya filtra la carga utilizando SELECT eliminando overhead en memoria.
   */
  async findAll(query: QueryUsersDto): Promise<PaginatedResult<AdminUserPayload>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [data, total] = await Promise.all([
      this.usersRepository.findMany(query),
      this.usersRepository.count(query),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Admin: cambio de rol ─────────────────────────────────────────────────

  /**
   * changeRole — Cambia el rol de un usuario.
   * Protege contra eliminar el último super_admin del sistema.
   * Solo puede ser ejecutado por un super_admin (see controller).
   */
  async changeRole(targetId: number, dto: UpdateRoleDto, currentUserId: number) {
    // ...resto del código intacto...
    const target = await this.usersRepository.findById(targetId);
    if (!target) throw new NotFoundException(`Usuario #${targetId} no encontrado`);

    // Evitar que el super_admin se cambie su propio rol
    if (targetId === currentUserId) {
      throw new BadRequestException('No puedes cambiar tu propio rol');
    }

    // Proteger el último super_admin del sistema
    if (target.role === UserRole.super_admin && dto.role !== UserRole.super_admin) {
      const superAdminCount = await this.usersRepository.countSuperAdmins();
      if (superAdminCount <= 1) {
        throw new BadRequestException(
          'No puedes quitar el rol de super_admin al único super_admin del sistema',
        );
      }
    }

    const updated = await this.usersRepository.updateRole(targetId, dto.role);

    this.logger.log(
      `User #${targetId} role changed from "${target.role}" to "${dto.role}" by super_admin #${currentUserId}`,
    );

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
    };
  }
}
