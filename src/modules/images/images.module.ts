import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { UploadModule } from '../upload/upload.module';

/**
 * ImagesModule
 *
 * Gestión de imágenes de trims con Cloudinary.
 * Importa UploadModule para reutilizar UploadService (subida y eliminación de archivos).
 *
 * Endpoints administrativos (requieren admin/super_admin):
 *   POST  /api/images/upload           → Subir imagen(es) a Cloudinary + registrar en BD
 *   PUT   /api/images/:id              → Actualizar metadatos (altText, type, sortOrder)
 *   DELETE /api/images/:id             → Eliminar de Cloudinary + BD
 *
 * Endpoints públicos:
 *   GET   /api/images                  → Listar paginado
 *   GET   /api/images/:id              → Obtener por ID
 *   GET   /api/images/by-trim/:trimId  → Imágenes de un trim
 */
@Module({
  imports: [UploadModule],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
