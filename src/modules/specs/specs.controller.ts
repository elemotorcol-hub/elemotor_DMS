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
import { SpecsService } from './specs.service';
import { CreateSpecDto } from './dto/create-spec.dto';
import { UpdateSpecDto } from './dto/update-spec.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('specs')
@Controller('specs')
export class SpecsController {
  constructor(private readonly specsService: SpecsService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear las especificaciones técnicas de un trim (relación 1-1)',
  })
  @ApiResponse({ status: 201, description: 'Spec creada exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o trimId no existe',
  })
  @ApiResponse({ status: 409, description: 'El trim ya tiene una spec' })
  create(@Body() dto: CreateSpecDto) {
    return this.specsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las specs (paginado)' })
  @ApiResponse({ status: 200, description: 'Lista de specs' })
  findAll(@Query() query: PaginationDto) {
    return this.specsService.findAll(query);
  }

  @Get('by-trim/:trimId')
  @ApiOperation({ summary: 'Obtener spec por trimId (acceso directo)' })
  @ApiParam({ name: 'trimId', type: Number })
  @ApiResponse({ status: 200, description: 'Spec encontrada' })
  @ApiResponse({ status: 404, description: 'Spec no encontrada para ese trim' })
  findByTrim(@Param('trimId', ParseIntPipe) trimId: number) {
    return this.specsService.findByTrim(trimId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener spec por ID (incluye trim, modelo y marca)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Spec encontrada' })
  @ApiResponse({ status: 404, description: 'Spec no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.specsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar campos de una spec (trimId no modificable)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Spec actualizada' })
  @ApiResponse({ status: 404, description: 'Spec no encontrada' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSpecDto) {
    return this.specsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una spec' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Spec eliminada' })
  @ApiResponse({ status: 404, description: 'Spec no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.specsService.remove(id);
  }
}
