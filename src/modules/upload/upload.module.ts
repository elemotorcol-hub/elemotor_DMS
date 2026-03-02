import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

/**
 * UploadModule
 *
 * Módulo reutilizable para subida de archivos a Cloudinary.
 * Exporta UploadService para que otros módulos puedan subir
 * archivos programáticamente sin exponer el controlador.
 *
 * Endpoints:
 *   POST /api/upload/image  → imágenes jpg | png | webp
 *   POST /api/upload/file   → archivos 3D (.glb) o PDF
 */
@Module({
  providers: [CloudinaryProvider, UploadService],
  controllers: [UploadController],
  exports: [UploadService],
})
export class UploadModule {}
