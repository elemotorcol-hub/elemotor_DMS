import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UploadModule } from '../upload/upload.module';

/**
 * UsersModule — Gestión de perfil y administración de usuarios.
 *
 * Endpoints:
 * - GET  /api/users/me        — Perfil propio (autenticado)
 * - PUT  /api/users/me        — Actualizar perfil (autenticado)
 * - PUT  /api/users/me/password — Cambiar contraseña (autenticado)
 * - GET  /api/users           — Listar usuarios (admin / super_admin)
 * - PUT  /api/users/:id/role  — Cambiar rol (super_admin)
 *
 * PrismaService se inyecta gracias a PrismaModule que es global.
 */
@Module({
  imports: [UploadModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
