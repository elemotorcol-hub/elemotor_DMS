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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ModelsService } from './models.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('models')
@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo modelo de vehículo' })
  @ApiResponse({ status: 201, description: 'Modelo creado exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o brandId no existe',
  })
  @ApiResponse({ status: 409, description: 'El slug ya existe' })
  create(@Body() dto: CreateModelDto) {
    return this.modelsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los modelos (paginado)' })
  @ApiResponse({ status: 200, description: 'Lista de modelos' })
  findAll(@Query() query: PaginationDto) {
    return this.modelsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener modelo por ID (incluye marca y trims activos)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Modelo encontrado' })
  @ApiResponse({ status: 404, description: 'Modelo no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.modelsService.findOne(id);
  }

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
