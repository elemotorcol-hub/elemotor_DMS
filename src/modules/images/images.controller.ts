import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  ParseFilePipeBuilder,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { ImagesService } from './images.service';
import { UploadImagesDto } from './dto/upload-images.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('images')
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  // ─── Admin: Upload múltiple ──────────────────────────────────────────────────

  /**
   * POST /api/images/upload
   * Sube uno o más archivos de imagen a Cloudinary y los registra en BD.
   * Solo accesible para admin / super_admin.
   */
  @Post('upload')
  @Roles(UserRole.admin, UserRole.super_admin)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB por archivo
    }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivos de imagen (jpg, png, webp — máx. 5 MB c/u) + metadatos',
    schema: {
      type: 'object',
      required: ['files', 'trimId', 'type'],
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        trimId: { type: 'integer', example: 1 },
        type: { type: 'string', enum: ['gallery', 'hero', 'interior', 'exterior', 'panoramic'] },
        altText: { type: 'string', example: 'Vista frontal del vehículo', nullable: true },
        sortOrder: { type: 'integer', example: 0, nullable: true },
      },
    },
  })
  @ApiOperation({ summary: '[Admin] Subir imágenes a Cloudinary y asociarlas a un trim' })
  @ApiResponse({ status: 201, description: 'Imágenes subidas y registradas exitosamente.' })
  @ApiResponse({ status: 400, description: 'Archivo inválido o trimId inválido.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes.' })
  @ApiResponse({ status: 404, description: 'Trim no encontrado.' })
  @ApiResponse({ status: 500, description: 'Error en Cloudinary o BD.' })
  uploadImages(
    @UploadedFiles(
      new ParseFilePipeBuilder()
        // Permite jpg, jpeg, png, webp
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|webp)$/,
        })
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024, // 5 MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: true,
        }),
    )
    files: Express.Multer.File[],
    @Body() dto: UploadImagesDto,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Se requiere al menos un archivo de imagen.');
    }
    return this.imagesService.uploadMany(files, dto);
  }

  // ─── Admin: Editar imagen ────────────────────────────────────────────────────

  /**
   * PUT /api/images/:id
   * Actualiza solo los metadatos de la imagen (altText, type, sortOrder).
   * No permite cambiar el archivo físico.
   */
  @Put(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Actualizar metadatos de una imagen (altText, type, sortOrder)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Imagen actualizada.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes.' })
  @ApiResponse({ status: 404, description: 'Imagen no encontrada.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateImageDto,
  ) {
    return this.imagesService.update(id, dto);
  }

  // ─── Admin: Eliminar imagen ──────────────────────────────────────────────────

  /**
   * DELETE /api/images/:id
   * Elimina la imagen de Cloudinary y de la BD.
   */
  @Delete(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Eliminar imagen de Cloudinary y de la BD' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Imagen eliminada.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes.' })
  @ApiResponse({ status: 404, description: 'Imagen no encontrada.' })
  @ApiResponse({ status: 500, description: 'Error al eliminar en Cloudinary.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.imagesService.remove(id);
  }

  // ─── Lectura pública ─────────────────────────────────────────────────────────

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar todas las imágenes (paginado)' })
  @ApiResponse({ status: 200, description: 'Lista de imágenes.' })
  findAll(@Query() query: PaginationDto) {
    return this.imagesService.findAll(query);
  }

  @Get('by-trim/:trimId')
  @Public()
  @ApiOperation({ summary: 'Listar imágenes de un trim (ordenadas por sortOrder)' })
  @ApiParam({ name: 'trimId', type: Number })
  @ApiResponse({ status: 200, description: 'Imágenes del trim.' })
  findByTrim(@Param('trimId', ParseIntPipe) trimId: number) {
    return this.imagesService.findByTrim(trimId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener imagen por ID (incluye trim, modelo y marca)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Imagen encontrada.' })
  @ApiResponse({ status: 404, description: 'Imagen no encontrada.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.imagesService.findOne(id);
  }
}
