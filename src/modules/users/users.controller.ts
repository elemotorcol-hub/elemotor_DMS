import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { UsersService } from './users.service';
import { UpdateProfileDto, ChangePasswordDto, QueryUsersDto, UpdateRoleDto, CreateUserDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ITokenPayload } from '../auth/interfaces/token-payload.interface';

interface AuthRequest {
  user: ITokenPayload;
}

/**
 * UsersController
 *
 * IMPORTANTE: las rutas estáticas (/me, /me/password) deben declararse
 * ANTES de las rutas con parámetro (:id) para evitar conflictos de enrutamiento.
 */
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ══════════════════════════════════════════════════════════════════════════
  // PERFIL PROPIO — /me (rutas estáticas primero)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/users/me
   * Retorna el perfil del usuario autenticado.
   */
  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario',
    schema: {
      example: {
        id: 1,
        name: 'Juan Pérez',
        email: 'juan@elemotor.co',
        phone: '+573001234567',
        city: 'Bogotá',
        avatarUrl: null,
        role: 'client',
        emailVerifiedAt: null,
        createdAt: '2026-03-01T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  getProfile(@Req() req: AuthRequest) {
    return this.usersService.getProfile(req.user.sub);
  }

  /**
   * PUT /api/users/me
   * Actualiza nombre, teléfono, ciudad y avatar del usuario autenticado.
   */
  @Put('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  updateProfile(@Body() dto: UpdateProfileDto, @Req() req: AuthRequest) {
    return this.usersService.updateProfile(req.user.sub, dto);
  }

  /**
   * PUT /api/users/me/password
   * Cambia la contraseña del usuario autenticado.
   * Requiere la contraseña actual. Invalida sesiones activas.
   */
  @Put('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar contraseña del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada. Reinicia sesión.' })
  @ApiResponse({ status: 400, description: 'Cuenta OAuth sin contraseña local' })
  @ApiResponse({ status: 401, description: 'Contraseña actual incorrecta' })
  changePassword(@Body() dto: ChangePasswordDto, @Req() req: AuthRequest) {
    return this.usersService.changePassword(req.user.sub, dto);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PÚBLICO — sin autenticación
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/users/advisors
   * Lista asesores disponibles (admin + super_admin) para el formulario de cotización.
   * Endpoint público — solo retorna id y nombre.
   */
  @Get('advisors')
  @Public()
  @ApiOperation({ summary: '[Público] Listar asesores disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de asesores' })
  getAdvisors() {
    return this.usersService.getAdvisors();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADMINISTRACIÓN — solo admin / super_admin
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/users
   * Crea un usuario empleado desde el panel admin.
   * Solo para super_admin.
   */
  @Post()
  @Roles(UserRole.super_admin)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[Super Admin] Crear usuario empleado' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Email ya registrado o datos inválidos' })
  @ApiResponse({ status: 403, description: 'Solo super_admin puede crear usuarios' })
  createEmployee(@Body() dto: CreateUserDto) {
    return this.usersService.createEmployee(dto);
  }

  /**
   * GET /api/users
   * Lista todos los usuarios con filtros y paginación.
   * Requiere rol admin o super_admin.
   */
  @Get()
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: '[Admin] Listar usuarios con filtros y paginación' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Buscar por nombre o email' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de usuarios' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  /**
   * GET /api/users/:id
   * Perfil completo de un usuario para el panel admin.
   * Incluye pedidos asociados (sin campos sensibles: passwordHash, refreshToken, etc.).
   * Debe declararse ANTES de PUT /:id/role para evitar conflictos de ruta.
   */
  @Get(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: '[Admin] Perfil de cliente con sus pedidos' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario con pedidos asociados' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  /**
   * PATCH /api/users/:id
   * Actualiza datos de perfil de cualquier usuario (name, phone, city).
   * Solo para super_admin.
   */
  @Patch(':id')
  @Roles(UserRole.super_admin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Super Admin] Editar datos de perfil de un usuario' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  updateUserById(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(id, dto);
  }

  /**
   * PUT /api/users/:id/role
   * Cambia el rol de un usuario.
   * Solo para super_admin. Protege al último super_admin del sistema.
   */
  @Put(':id/role')
  @Roles(UserRole.admin, UserRole.super_admin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Super Admin] Cambiar rol de un usuario' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Rol actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Rol inválido o último super_admin protegido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo super_admin puede cambiar roles' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @Req() req: AuthRequest,
  ) {
    return this.usersService.changeRole(id, dto, req.user.sub);
  }
}
