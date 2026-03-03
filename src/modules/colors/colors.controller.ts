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
import { ColorsService } from './colors.service';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('colors')
@Controller('colors')
export class ColorsController {
  constructor(private readonly colorsService: ColorsService) {}

  // ─── Escritura — solo admin / super_admin ────────────────────────────────

  @Post()
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Registrar un nuevo color para un trim' })
  @ApiResponse({ status: 201, description: 'Color creado exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos (hexCode, trimId no existe, etc.)',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 409, description: 'Color duplicado para ese trim' })
  create(@Body() dto: CreateColorDto) {
    return this.colorsService.create(dto);
  }

  // ─── Lectura pública ──────────────────────────────────────────────────────

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar todos los colores (paginado)' })
  @ApiResponse({ status: 200, description: 'Lista de colores' })
  findAll(@Query() query: PaginationDto) {
    return this.colorsService.findAll(query);
  }

  @Get('by-trim/:trimId')
  @Public()
  @ApiOperation({ summary: 'Listar colores de un trim específico' })
  @ApiParam({ name: 'trimId', type: Number })
  @ApiResponse({ status: 200, description: 'Colores del trim' })
  findByTrim(@Param('trimId', ParseIntPipe) trimId: number) {
    return this.colorsService.findByTrim(trimId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Obtener color por ID (incluye trim, modelo y marca)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Color encontrado' })
  @ApiResponse({ status: 404, description: 'Color no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.colorsService.findOne(id);
  }

  // ─── Mutación — solo admin / super_admin ─────────────────────────────────

  @Put(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Actualizar campos de un color' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Color actualizado' })
  @ApiResponse({ status: 400, description: 'hexCode inválido o referencia no existe' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Color no encontrado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateColorDto) {
    return this.colorsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Eliminar un color' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Color eliminado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Color no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.colorsService.remove(id);
  }
}
