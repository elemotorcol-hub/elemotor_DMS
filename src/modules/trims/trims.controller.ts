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
import { TrimsService } from './trims.service';
import { CreateTrimDto } from './dto/create-trim.dto';
import { UpdateTrimDto } from './dto/update-trim.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('trims')
@Controller('trims')
export class TrimsController {
  constructor(private readonly trimsService: TrimsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo trim/versión de modelo' })
  @ApiResponse({ status: 201, description: 'Trim creado exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o modelId no existe',
  })
  create(@Body() dto: CreateTrimDto) {
    return this.trimsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los trims (paginado)' })
  @ApiResponse({ status: 200, description: 'Lista de trims' })
  findAll(@Query() query: PaginationDto) {
    return this.trimsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Obtener trim por ID (incluye modelo, marca, spec, colores, imágenes)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Trim encontrado' })
  @ApiResponse({ status: 404, description: 'Trim no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.trimsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar campos de un trim' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Trim actualizado' })
  @ApiResponse({ status: 400, description: 'Reference ID no existe' })
  @ApiResponse({ status: 404, description: 'Trim no encontrado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTrimDto) {
    return this.trimsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un trim' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Trim eliminado' })
  @ApiResponse({ status: 404, description: 'Trim no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.trimsService.remove(id);
  }
}
