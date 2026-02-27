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
import { ImagesService } from './images.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('images')
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar una nueva imagen para un trim' })
  @ApiResponse({ status: 201, description: 'Imagen creada exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o trimId no existe',
  })
  @ApiResponse({ status: 409, description: 'URL duplicada para ese trim' })
  create(@Body() dto: CreateImageDto) {
    return this.imagesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las imágenes (paginado)' })
  @ApiResponse({ status: 200, description: 'Lista de imágenes' })
  findAll(@Query() query: PaginationDto) {
    return this.imagesService.findAll(query);
  }

  @Get('by-trim/:trimId')
  @ApiOperation({
    summary: 'Listar imágenes de un trim específico (ordenadas por sortOrder)',
  })
  @ApiParam({ name: 'trimId', type: Number })
  @ApiResponse({ status: 200, description: 'Imágenes del trim' })
  findByTrim(@Param('trimId', ParseIntPipe) trimId: number) {
    return this.imagesService.findByTrim(trimId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener imagen por ID (incluye trim, modelo y marca)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Imagen encontrada' })
  @ApiResponse({ status: 404, description: 'Imagen no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.imagesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar campos de una imagen' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Imagen actualizada' })
  @ApiResponse({ status: 404, description: 'Imagen no encontrada' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateImageDto) {
    return this.imagesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una imagen' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Imagen eliminada' })
  @ApiResponse({ status: 404, description: 'Imagen no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.imagesService.remove(id);
  }
}
