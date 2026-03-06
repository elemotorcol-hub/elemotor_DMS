import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentsRepository } from './documents.repository';
import { UploadModule } from '../upload/upload.module';

/**
 * DocumentsModule — Gestión de documentos asociados a pedidos.
 *
 * Endpoints:
 * - GET  /api/documents/my         — Listar mis documentos (autenticado)
 * - POST /api/documents/upload     — Subir PDF a Cloudinary (autenticado)
 * - GET  /api/documents/:id/download — URL firmada para descarga (autenticado)
 *
 * Importa UploadModule para reutilizar UploadService y CloudinaryProvider.
 * PrismaService se inyecta gracias a PrismaModule global.
 */
@Module({
  imports: [UploadModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsRepository],
})
export class DocumentsModule {}
