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
  ApiQuery,
} from '@nestjs/swagger';
import { ModelType } from '@prisma/client';
import { ModelsService } from './models.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { QueryModelDto } from './dto/query-model.dto';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@ApiTags('models')
@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  // ─── Escritura ────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo modelo de vehículo' })
  @ApiResponse({ status: 201, description: 'Modelo creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o brandId no existe' })
  @ApiResponse({ status: 409, description: 'El slug ya existe' })
  create(@Body() dto: CreateModelDto) {
    return this.modelsService.create(dto);
  }

  // ─── Lectura pública ──────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Listar modelos con filtros, orden y paginación' })
  @ApiQuery({ name: 'brandId', required: false, type: Number, description: 'Filtrar por ID de marca' })
  @ApiQuery({ name: 'name', required: false, description: 'Búsqueda parcial por nombre del modelo' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Filtrar por año del modelo' })
  @ApiQuery({ name: 'type', required: false, enum: ModelType, description: 'Filtrar por tipo de carrocería' })
  @ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Filtrar por estado activo' })
  @ApiQuery({ name: 'featured', required: false, type: Boolean, description: 'Filtrar solo modelos destacados' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'year', 'basePrice', 'createdAt'], description: 'Campo de ordenamiento' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], description: 'Dirección del ordenamiento' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Resultados por página (default: 10, max: 100)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de modelos' })
  findAll(@Query() query: QueryModelDto) {
    return this.modelsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener modelo por ID (incluye marca y trims activos)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Modelo encontrado' })
  @ApiResponse({ status: 404, description: 'Modelo no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.modelsService.findOne(id);
  }

  // ─── Mutación ─────────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar campos de un modelo' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Modelo actualizado' })
  @ApiResponse({ status: 400, description: 'Reference ID no existe' })
  @ApiResponse({ status: 404, description: 'Modelo no encontrado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateModelDto) {
    return this.modelsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un modelo' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Modelo eliminado' })
  @ApiResponse({ status: 404, description: 'Modelo no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.modelsService.remove(id);
  }
}
