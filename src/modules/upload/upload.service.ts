import {
  Injectable,
  Inject,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { v2 as CloudinaryV2 } from 'cloudinary';
import { Readable } from 'stream';

import { CLOUDINARY_CLIENT } from './cloudinary.provider';
import { validateFile, AssetType, FileUploadType } from './upload.validators';
import { UploadResultDto } from './dto/upload-result.dto';

/** Carpetas en Cloudinary por tipo de recurso */
const FOLDERS: Record<AssetType, string> = {
  image: 'elemotor/vehicles',
  model3d: 'elemotor/3d',
  document: 'elemotor/docs',
};


@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    @Inject(CLOUDINARY_CLIENT)
    private readonly cloudinary: typeof CloudinaryV2,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // uploadImage
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Sube una imagen (jpg | png | webp) a Cloudinary.
   * Carpeta destino: elemotor/vehicles
   * Tamaño máximo: 5 MB
   */
  async uploadImage(file: Express.Multer.File): Promise<UploadResultDto> {
    validateFile(file, FileUploadType.IMAGE);
    return this.streamToCloudinary(file, FileUploadType.IMAGE, 'image');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // uploadTrimImage
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Sube una imagen de trim a Cloudinary.
   * Carpeta destino: elemotor/vehicles (misma que /api/upload/image)
   * Tamaño máximo: 5 MB
   */
  async uploadTrimImage(file: Express.Multer.File): Promise<UploadResultDto> {
    validateFile(file, FileUploadType.IMAGE);
    return this.streamToCloudinary(file, FileUploadType.IMAGE, 'image');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // uploadTrimModel3d
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Sube un modelo 3D (.glb) de trim a Cloudinary.
   * Carpeta destino: elemotor/3d (misma que /api/upload/file)
   * Tamaño máximo: 15 MB
   */
  async uploadTrimModel3d(file: Express.Multer.File): Promise<UploadResultDto> {
    validateFile(file, FileUploadType.MODEL_3D);
    return this.streamToCloudinary(file, FileUploadType.MODEL_3D, 'raw');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // uploadFile
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Sube un archivo 3D (.glb) o documento PDF a Cloudinary.
   */
  async uploadFile(
    file: Express.Multer.File,
    type: FileUploadType.MODEL_3D | FileUploadType.DOCUMENT,
  ): Promise<UploadResultDto> {
    validateFile(file, type);
    return this.streamToCloudinary(file, type, 'raw');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // deleteFile
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Elimina un archivo de Cloudinary usando su publicId.
   * @param publicId - Identificador del recurso en Cloudinary (ej: trims/images/abc123)
   * @param resourceType - 'image' para imágenes, 'raw' para GLB u otros binarios
   */
  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'raw' = 'image',
  ): Promise<void> {
    try {
      const result = await this.cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new InternalServerErrorException(
          `Cloudinary no pudo eliminar el archivo: ${result.result}`,
        );
      }

      if (result.result === 'not found') {
        this.logger.warn(
          `Cloudinary: archivo no encontrado al eliminar (publicId: ${publicId}). Puede haber sido eliminado previamente.`,
        );
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(
        `Cloudinary deleteFile falló [publicId: ${publicId}]: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Error al eliminar el archivo en Cloudinary. Inténtelo más tarde.',
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Extrae el nombre del archivo sin extensión y limpia caracteres problemáticos.
   */
  private sanitizeFilename(originalname: string): string {
    const nameWithoutExt = originalname.substring(0, originalname.lastIndexOf('.')) || originalname;
    return nameWithoutExt
      .normalize('NFD') // Descompone tildes/acentos
      .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos
      .replace(/[^a-zA-Z0-9_\-]/g, '_') // Reemplaza lo no alfanumérico por "_"
      .replace(/_+/g, '_') // Evita múltiples guiones bajos seguidos
      .replace(/^_|_$/g, ''); // Quita guiones iniciales o finales
  }

  /**
   * Convierte el buffer de Multer en un readable stream y lo sube
   * a Cloudinary usando upload_stream (sin escribir en disco).
   */
  private streamToCloudinary(
    file: Express.Multer.File,
    assetType: AssetType,
    resourceType: 'image' | 'raw',
    folderOverride?: string,
  ): Promise<UploadResultDto> {
    return new Promise((resolve, reject) => {
      const folder = folderOverride ?? FOLDERS[assetType];

      const sanitizedName = this.sanitizeFilename(file.originalname);

      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          use_filename: true, // Usa el nombre que le pasamos
          filename_override: sanitizedName,
          unique_filename: true, // Cloudinary le añadirá un sufijo aleatorio para evitar colisiones
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error(
              `Cloudinary upload failed [${assetType}]: ${error?.message ?? 'unknown error'}`,
            );
            return reject(
              new InternalServerErrorException(
                'Error al subir el archivo a Cloudinary. Inténtelo más tarde.',
              ),
            );
          }

          resolve({
            publicUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            size: result.bytes,
          });
        },
      );

      // Convertir buffer en stream y piped a Cloudinary
      Readable.from(file.buffer).pipe(uploadStream);
    });
  }
}
