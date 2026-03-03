import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { TrimsService } from './trims.service';
import { CreateTrimDto } from './dto/create-trim.dto';
import { UpdateTrimDto } from './dto/update-trim.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('trims')
@Controller('trims')
export class TrimsController {
  constructor(private readonly trimsService: TrimsService) {}

  // ─── Escritura — solo admin / super_admin ────────────────────────────────

  @Post()
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Crear un nuevo trim/versión de modelo' })
  @ApiResponse({ status: 201, description: 'Trim creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o modelId no existe' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  create(@Body() dto: CreateTrimDto) {
    return this.trimsService.create(dto);
  }

  // ─── Lectura pública ──────────────────────────────────────────────────────

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar todos los trims activos (paginado)' })
  @ApiResponse({ status: 200, description: 'Lista de trims' })
  findAll(@Query() query: PaginationDto) {
    return this.trimsService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Obtener trim activo por ID (incluye modelo, marca, spec, colores, imágenes)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Trim encontrado' })
  @ApiResponse({ status: 404, description: 'Trim no encontrado o inactivo' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.trimsService.findOne(id);
  }

  // ─── Mutación — solo admin / super_admin ─────────────────────────────────

  @Put(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Actualizar campos de un trim' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Trim actualizado' })
  @ApiResponse({ status: 400, description: 'Reference ID no existe' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Trim no encontrado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTrimDto) {
    return this.trimsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Desactivar un trim (soft delete: active = false)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Trim desactivado (soft delete)' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Trim no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.trimsService.remove(id);
  }
}
