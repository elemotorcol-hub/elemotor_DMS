import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Query,
  ParseFilePipe,
  HttpCode,
  HttpStatus,
  ParseEnumPipe,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

import { UploadService } from './upload.service';
import { UploadResultDto } from './dto/upload-result.dto';
import { FileUploadType } from './upload.validators';

@ApiTags('upload')
@ApiBearerAuth()
@Throttle({ default: { limit: 10, ttl: 60000 } }) // Máx. 10 subidas por IP cada minuto
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /api/upload/image
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Sube una imagen (jpg, png, webp) a Cloudinary.
   * Requiere autenticación JWT (guard global).
   */
  @Post('image')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB — primera línea de defensa
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Imagen a subir (jpg | png | webp, máx. 5 MB)',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Subir imagen de vehículo a Cloudinary' })
  @ApiResponse({ status: 201, type: UploadResultDto, description: 'Imagen subida exitosamente.' })
  @ApiResponse({ status: 400, description: 'Formato o tamaño inválido.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 500, description: 'Error interno al subir a Cloudinary.' })
  uploadImage(
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
    file: Express.Multer.File,
  ): Promise<UploadResultDto> {
    return this.uploadService.uploadImage(file);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /api/upload/file
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Sube un archivo 3D (.glb) o documento PDF a Cloudinary.
   * El parámetro `type` determina la carpeta destino y las validaciones:
   *   - model3d → elemotor/3d  (máx. 15 MB)
   *   - document → elemotor/docs (máx. 10 MB)
   * Requiere autenticación JWT (guard global).
   */
  @Post('file')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB — límite máximo del grupo
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'type',
    enum: FileUploadType,
    required: true,
    description: '"model3d" para archivos GLB | "document" para PDF',
  })
  @ApiBody({
    description: 'Archivo 3D (.glb, máx. 15 MB) o PDF (máx. 10 MB)',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Subir archivo 3D o PDF a Cloudinary' })
  @ApiResponse({ status: 201, type: UploadResultDto, description: 'Archivo subido exitosamente.' })
  @ApiResponse({ status: 400, description: 'Tipo, formato o tamaño inválido.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 500, description: 'Error interno al subir a Cloudinary.' })
  uploadFile(
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
    file: Express.Multer.File,
    @Query('type', new ParseEnumPipe(FileUploadType)) type: FileUploadType,
  ): Promise<UploadResultDto> {
    if (type === FileUploadType.IMAGE) {
      throw new BadRequestException(
        'El endpoint /file no admite subida de imágenes. Usa /image.',
      );
    }
    return this.uploadService.uploadFile(
      file,
      type as FileUploadType.MODEL_3D | FileUploadType.DOCUMENT,
    );
  }
}
