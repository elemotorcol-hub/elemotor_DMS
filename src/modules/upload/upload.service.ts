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
   *
   * @param file - Archivo recibido de Multer (buffer en memoria)
   * @returns UploadResultDto con publicUrl, publicId, format y size
   */
  async uploadImage(file: Express.Multer.File): Promise<UploadResultDto> {
    validateFile(file, FileUploadType.IMAGE);
    return this.streamToCloudinary(file, FileUploadType.IMAGE, 'image');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // uploadFile
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Sube un archivo 3D (.glb) o documento PDF a Cloudinary.
   * Carpetas destino:
   *   - model3d → elemotor/3d
   *   - document → elemotor/docs
   * Tamaños máximos: 3D = 15 MB | PDF = 10 MB
   *
   * @param file - Archivo recibido de Multer
   * @param type - 'model3d' | 'document'
   * @returns UploadResultDto con publicUrl, publicId, format y size
   */
  async uploadFile(
    file: Express.Multer.File,
    type: FileUploadType.MODEL_3D | FileUploadType.DOCUMENT,
  ): Promise<UploadResultDto> {
    validateFile(file, type);
    // Cloudinary maneja archivos no-imagen con resource_type 'raw'
    return this.streamToCloudinary(file, type, 'raw');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Convierte el buffer de Multer en un readable stream y lo sube
   * a Cloudinary usando upload_stream (sin escribir en disco).
   *
   * @param file         - Archivo Multer
   * @param assetType    - Tipo lógico para determinar la carpeta
   * @param resourceType - Tipo de recurso de Cloudinary ('image' | 'raw')
   */
  private streamToCloudinary(
    file: Express.Multer.File,
    assetType: AssetType,
    resourceType: 'image' | 'raw',
  ): Promise<UploadResultDto> {
    return new Promise((resolve, reject) => {
      const folder = FOLDERS[assetType];

      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          use_filename: false,
          unique_filename: true,
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
