import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseFilePipeBuilder,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

import { Models3dService } from './models-3d.service';
import { UploadModel3dDto } from './dto/upload-model-3d.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('models-3d')
@Controller('models-3d')
export class Models3dController {
  constructor(private readonly models3dService: Models3dService) {}

  // ─── Admin: Upload ────────────────────────────────────────────────────────────

  /**
   * POST /api/models-3d/upload
   * Sube un archivo GLB a Cloudinary y lo asocia a un trim.
   * Solo un modelo 3D por trim.
   */
  @Post('upload')
  @Roles(UserRole.admin, UserRole.super_admin)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
    }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo GLB (máx. 15 MB) y el trimId al que se asocia',
    schema: {
      type: 'object',
      required: ['file', 'trimId'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Archivo .glb' },
        trimId: { type: 'integer', example: 1, description: 'ID del trim' },
      },
    },
  })
  @ApiOperation({ summary: '[Admin] Subir modelo 3D (.glb) a Cloudinary y asociarlo al trim' })
  @ApiResponse({ status: 201, description: 'Modelo 3D subido y registrado.' })
  @ApiResponse({ status: 400, description: 'Archivo inválido.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes.' })
  @ApiResponse({ status: 404, description: 'Trim no encontrado.' })
  @ApiResponse({ status: 409, description: 'El trim ya tiene un modelo 3D.' })
  @ApiResponse({ status: 500, description: 'Error en Cloudinary o BD.' })
  upload(
    @UploadedFile(
      new ParseFilePipeBuilder()
        // Validar .glb extension o mimetype. A veces es application/octet-stream, así que validamos por regex de nombre o mimetype general.
        // Dado que el fileType validator de NestJS revisa el mimetype de express (que para glb puede ser ambiguo), 
        // usamos una validación básica de extensión / mime.
        .addFileTypeValidator({
          fileType: /(model\/gltf-binary|application\/octet-stream|glb)/,
        })
        .addMaxSizeValidator({
          maxSize: 15 * 1024 * 1024, // 15 MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: true,
        }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadModel3dDto,
  ) {
    if (!file) {
      throw new BadRequestException('Se requiere un archivo .glb.');
    }
    return this.models3dService.upload(file, dto);
  }

  // ─── Admin: Eliminar ─────────────────────────────────────────────────────────

  /**
   * DELETE /api/models-3d/:id
   * Elimina el modelo 3D de Cloudinary y de la BD.
   */
  @Delete(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Eliminar modelo 3D de Cloudinary y de la BD' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Modelo 3D eliminado.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes.' })
  @ApiResponse({ status: 404, description: 'Modelo 3D no encontrado.' })
  @ApiResponse({ status: 500, description: 'Error al eliminar en Cloudinary.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.models3dService.remove(id);
  }

  // ─── Lectura pública ──────────────────────────────────────────────────────────

  /**
   * GET /api/models-3d/by-trim/:trimId
   * Retorna el modelo 3D del trim (o null si no tiene).
   */
  @Get('by-trim/:trimId')
  @Public()
  @ApiOperation({ summary: 'Obtener modelo 3D de un trim' })
  @ApiParam({ name: 'trimId', type: Number })
  @ApiResponse({ status: 200, description: 'Modelo 3D del trim (null si no existe).' })
  findByTrim(@Param('trimId', ParseIntPipe) trimId: number) {
    return this.models3dService.findByTrim(trimId);
  }

  /**
   * GET /api/models-3d/:id
   * Retorna un modelo 3D por ID.
   */
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener modelo 3D por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Modelo 3D encontrado.' })
  @ApiResponse({ status: 404, description: 'Modelo 3D no encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.models3dService.findOne(id);
  }
}
