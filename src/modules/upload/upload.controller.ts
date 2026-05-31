import {
  Controller,
  Post,
  Get,
  Body,
  UploadedFile,
  UseInterceptors,
  Query,
  ParseFilePipe,
  HttpCode,
  HttpStatus,
  ParseEnumPipe,
  BadRequestException,
  Res,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
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
import { Public } from '../auth/decorators/public.decorator';

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
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB — primera línea de defensa
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
  @ApiOperation({ summary: 'Subir imagen a Cloudinary (vehículos por defecto)' })
  @ApiQuery({
    name: 'folder',
    required: false,
    type: String,
    description: 'Carpeta destino en subdirectorio de elemotor (ej: "brands"). Por defecto "elemotor/vehicles".',
  })
  @ApiResponse({ status: 201, type: UploadResultDto, description: 'Imagen subida exitosamente.' })
  @ApiResponse({ status: 400, description: 'Formato o tamaño inválido.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 500, description: 'Error interno al subir a Cloudinary.' })
  uploadImage(
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
    file: Express.Multer.File,
    @Query('folder') folder?: string,
  ): Promise<UploadResultDto> {
    let folderOverride: string | undefined;
    if (folder) {
      // Validar input omitiendo caracteres peligrosos
      const cleanFolder = folder.replace(/[^a-zA-Z0-9_\-]/g, '');
      if (cleanFolder) {
        folderOverride = `elemotor/${cleanFolder}`;
      }
    }
    return this.uploadService.uploadImage(file, folderOverride);
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

  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE /api/upload
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Elimina un archivo de Cloudinary.
   */
  @Post('delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar archivo de Cloudinary por publicId' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['publicId'],
      properties: {
        publicId: { type: 'string' },
        resourceType: { type: 'string', enum: ['image', 'raw'], default: 'image' }
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Archivo eliminado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Falta publicId.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  async deleteFileByPost(
    @Body('publicId') publicId: string,
    @Body('resourceType') resourceType: 'image' | 'raw' = 'image',
  ): Promise<{ message: string }> {
    if (!publicId) {
      throw new BadRequestException('Se requiere publicId');
    }
    await this.uploadService.deleteFile(publicId, resourceType);
    return { message: 'Archivo eliminado' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /api/upload/pdf-download
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Proxy público para descargar PDFs desde Cloudinary.
   * Sirve el archivo con Content-Disposition: attachment para forzar descarga.
   */
  @Get('pdf-download')
  @Public()
  @ApiOperation({ summary: '[Público] Descargar PDF desde Cloudinary' })
  @ApiQuery({ name: 'url', required: true, type: String })
  @ApiResponse({ status: 200, description: 'PDF descargado exitosamente.' })
  async downloadPdf(
    @Query('url') url: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!url || !url.startsWith('https://res.cloudinary.com/')) {
      throw new BadRequestException('URL inválida');
    }

    let pdfBuffer: ArrayBuffer;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new InternalServerErrorException('No se pudo obtener el PDF');
      }
      pdfBuffer = await response.arrayBuffer();
    } catch {
      throw new InternalServerErrorException('Error al descargar el PDF');
    }

    const filename = url.split('/').pop()?.split('?')[0] ?? 'ficha-tecnica.pdf';
    const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Content-Length': pdfBuffer.byteLength.toString(),
      'Cache-Control': 'public, max-age=86400',
    });
    res.end(Buffer.from(pdfBuffer));
  }
}
