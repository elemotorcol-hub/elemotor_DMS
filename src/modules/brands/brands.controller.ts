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
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { QueryBrandDto } from './dto/query-brand.dto';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  // ─── Escritura (requeriría Auth en producción; por ahora @Public heredado) ─

  @Post()
  @ApiOperation({ summary: 'Crear una nueva marca' })
  @ApiResponse({ status: 201, description: 'Marca creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'El slug ya existe' })
  create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  // ─── Lectura pública ──────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Listar marcas con filtros, orden y paginación' })
  @ApiQuery({ name: 'name', required: false, description: 'Búsqueda parcial por nombre' })
  @ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Filtrar por estado activo' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'country', 'createdAt'], description: 'Campo de ordenamiento' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], description: 'Dirección del ordenamiento' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Resultados por página (default: 10, max: 100)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de marcas' })
  findAll(@Query() query: QueryBrandDto) {
    return this.brandsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener marca por ID (incluye modelos activos)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Marca encontrada' })
  @ApiResponse({ status: 404, description: 'Marca no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.findOne(id);
  }

  // ─── Mutación ─────────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar campos de una marca' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Marca actualizada' })
  @ApiResponse({ status: 404, description: 'Marca no encontrada' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBrandDto) {
    return this.brandsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una marca' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Marca eliminada' })
  @ApiResponse({ status: 404, description: 'Marca no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.remove(id);
  }
}
