import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { ITokenPayload } from '../auth/interfaces/token-payload.interface';

interface AuthRequest {
  user: ITokenPayload;
}

/**
 * DocumentsController
 *
 * ⚠️  Rutas estáticas (/my, /upload) ANTES de rutas con parámetro (/:id/download)
 */
@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // ══════════════════════════════════════════════════════════════════════════
  // RUTAS ESTÁTICAS — declaradas primero
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/documents/my
   * Retorna los documentos del usuario autenticado.
   */
  @Get('my')
  @ApiOperation({ summary: 'Listar mis documentos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de documentos del usuario autenticado',
    schema: {
      example: [
        {
          id: 1,
          name: 'SOAT 2026',
          type: 'soat',
          fileUrl: 'https://res.cloudinary.com/...',
          publicId: 'elemotor/docs/soat_abc123',
          uploadedBy: 'client',
          createdAt: '2026-03-06T10:00:00.000Z',
          orderId: 1,
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  findMyDocuments(@Req() req: AuthRequest) {
    return this.documentsService.findMyDocuments(req.user.sub);
  }

  /**
   * POST /api/documents/upload
   * Sube un documento PDF a Cloudinary y lo asocia a un pedido del usuario.
   * Campos de body (multipart/form-data): orderId, type, name + file (PDF).
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB — primera línea de defensa
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Documento PDF a subir junto con sus metadatos',
    schema: {
      type: 'object',
      required: ['file', 'orderId', 'type', 'name'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'PDF (máx. 10 MB)' },
        orderId: { type: 'integer', example: 1, description: 'ID del pedido' },
        type: {
          type: 'string',
          enum: ['invoice', 'soat', 'import_cert', 'property_card', 'manual', 'other'],
          example: 'soat',
        },
        name: { type: 'string', example: 'SOAT 2026', maxLength: 255 },
      },
    },
  })
  @ApiOperation({ summary: 'Subir documento PDF asociado a un pedido' })
  @ApiResponse({ status: 201, description: 'Documento subido y guardado exitosamente' })
  @ApiResponse({ status: 400, description: 'Archivo o datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado o no pertenece al usuario' })
  uploadDocument(
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
    file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @Req() req: AuthRequest,
  ) {
    return this.documentsService.uploadDocument(
      req.user.sub,
      req.user.role,
      file,
      dto,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RUTAS CON PARÁMETRO — declaradas después de rutas estáticas
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/documents/:id/download
   * Genera una URL firmada de Cloudinary para descargar el documento de forma segura.
   * - Clientes: solo pueden descargar sus propios documentos.
   * - Admin / Super_admin: pueden descargar cualquier documento.
   */
  @Get(':id/download')
  @ApiOperation({ summary: 'Obtener URL firmada de Cloudinary para descarga segura' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del documento' })
  @ApiResponse({
    status: 200,
    description: 'URL firmada válida por 15 minutos',
    schema: {
      example: {
        url: 'https://res.cloudinary.com/.../soat_abc123.pdf?signature=...',
        expiresAt: '2026-03-06T10:15:00.000Z',
        documentName: 'SOAT 2026',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado o sin acceso' })
  getDownloadUrl(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.documentsService.getDownloadUrl(id, req.user.sub, req.user.role);
  }
}
