import { Module } from '@nestjs/common';
import { Models3dService } from './models-3d.service';
import { Models3dController } from './models-3d.controller';
import { UploadModule } from '../upload/upload.module';

/**
 * Models3dModule
 *
 * Gestión de modelos 3D (.glb) de trims con Cloudinary.
 * Importa UploadModule para reutilizar UploadService.
 *
 * Restricción: un solo modelo 3D por trim (@@unique en schema).
 *
 * Endpoints administrativos (requieren admin/super_admin):
 *   POST   /api/models-3d/upload         → Subir GLB a Cloudinary + registrar en BD
 *   DELETE /api/models-3d/:id            → Eliminar de Cloudinary + BD
 *
 * Endpoints públicos:
 *   GET    /api/models-3d/by-trim/:trimId → Modelo 3D del trim
 *   GET    /api/models-3d/:id             → Obtener por ID
 */
@Module({
  imports: [UploadModule],
  controllers: [Models3dController],
  providers: [Models3dService],
  exports: [Models3dService],
})
export class Models3dModule {}
