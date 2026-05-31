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
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { QueryBrandDto } from './dto/query-brand.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  // ─── Escritura — solo admin / super_admin ────────────────────────────────

  @Post()
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Crear una nueva marca' })
  @ApiResponse({ status: 201, description: 'Marca creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 409, description: 'El slug ya existe' })
  create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  // ─── Lectura pública ──────────────────────────────────────────────────────

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar marcas activas con filtros y paginación' })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'country', 'createdAt'] })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de marcas' })
  findAll(@Query() query: QueryBrandDto) {
    return this.brandsService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener marca activa por ID (incluye modelos activos)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Marca encontrada' })
  @ApiResponse({ status: 404, description: 'Marca no encontrada o inactiva' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.findOne(id);
  }

  // ─── Mutación — solo admin / super_admin ─────────────────────────────────

  @Put(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Actualizar campos de una marca' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Marca actualizada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Marca no encontrada' })
  @ApiResponse({ status: 409, description: 'El slug ya existe' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBrandDto) {
    return this.brandsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Desactivar una marca (soft delete: active = false)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Marca desactivada (soft delete)' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Marca no encontrada' })
  @ApiResponse({ status: 409, description: 'La marca tiene modelos activos asociados' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.remove(id);
  }
}
