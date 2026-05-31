import { 
  Controller, Get, Post, Put, Delete, Body, Param, Query, 
  ParseIntPipe, UseInterceptors, UploadedFile, ParseFilePipeBuilder, 
  HttpStatus, HttpCode, DefaultValuePipe
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { WorkshopsService } from './workshops.service';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { QueryWorkshopsDto } from './dto/query-workshops.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('workshops')
@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly service: WorkshopsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar talleres con filtros y búsqueda geográfica' })
  @ApiResponse({ status: 200, description: 'Lista de talleres encontrada.' })
  findAll(@Query() query: QueryWorkshopsDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener detalle de un taller' })
  @ApiResponse({ status: 200, description: 'Taller encontrado.' })
  @ApiResponse({ status: 404, description: 'Taller no encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Crear un nuevo taller' })
  @ApiResponse({ status: 201, description: 'Taller creado exitosamente.' })
  create(@Body() dto: CreateWorkshopDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Actualizar un taller existente' })
  @ApiResponse({ status: 200, description: 'Taller actualizado.' })
  @ApiResponse({ status: 404, description: 'Taller no encontrado.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorkshopDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Eliminar (soft delete) un taller' })
  @ApiResponse({ status: 204, description: 'Taller eliminado.' })
  @ApiResponse({ status: 404, description: 'Taller no encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Post(':id/images')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '[Admin] Subir una imagen para un taller' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        altText: { type: 'string' },
        sortOrder: { type: 'integer', default: 0 }
      }
    }
  })
  uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ })
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })
    ) file: Express.Multer.File,
    @Body('altText', new DefaultValuePipe('')) altText: string,
    @Body('sortOrder', new DefaultValuePipe(0), ParseIntPipe) sortOrder: number
  ) {
    return this.service.uploadImage(id, file, altText, sortOrder);
  }
}
