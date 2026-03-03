import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
import { SpecsService } from './specs.service';
import { CreateSpecDto } from './dto/create-spec.dto';
import { UpdateSpecDto } from './dto/update-spec.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('specs')
@Controller('specs')
export class SpecsController {
  constructor(private readonly specsService: SpecsService) {}

  // ─── Escritura — solo admin / super_admin ────────────────────────────────

  @Post()
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[Admin] Crear las especificaciones técnicas de un trim (relación 1-1)',
  })
  @ApiResponse({ status: 201, description: 'Spec creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o trimId no existe' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 409, description: 'El trim ya tiene una spec asociada' })
  create(@Body() dto: CreateSpecDto) {
    return this.specsService.create(dto);
  }

  // ─── Lectura pública ──────────────────────────────────────────────────────

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar todas las specs (paginado)' })
  @ApiResponse({ status: 200, description: 'Lista de specs' })
  findAll(@Query() query: PaginationDto) {
    return this.specsService.findAll(query);
  }

  @Get('by-trim/:trimId')
  @Public()
  @ApiOperation({ summary: 'Obtener spec por trimId (acceso directo)' })
  @ApiParam({ name: 'trimId', type: Number })
  @ApiResponse({ status: 200, description: 'Spec encontrada' })
  @ApiResponse({ status: 404, description: 'Spec no encontrada para ese trim' })
  findByTrim(@Param('trimId', ParseIntPipe) trimId: number) {
    return this.specsService.findByTrim(trimId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Obtener spec por ID (incluye trim, modelo y marca)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Spec encontrada' })
  @ApiResponse({ status: 404, description: 'Spec no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.specsService.findOne(id);
  }

  // ─── Mutación — solo admin / super_admin ─────────────────────────────────

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[Admin] Actualizar campos de una spec (trimId no modificable)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Spec actualizada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Spec no encontrada' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSpecDto) {
    return this.specsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Eliminar una spec' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Spec eliminada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Spec no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.specsService.remove(id);
  }
}
