import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

// ─── Tipos de archivo manejados por el módulo ─────────────────────────────────
export enum FileUploadType {
  IMAGE = 'image',
  MODEL_3D = 'model3d',
  DOCUMENT = 'document',
}

export type AssetType = FileUploadType | 'workshops';

// ─── Configuración de restricciones por tipo ──────────────────────────────────
interface AssetConstraints {
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  maxSizeBytes: number;
  label: string;
}

const CONSTRAINTS: Record<AssetType, AssetConstraints> = {
  [FileUploadType.IMAGE]: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    label: 'Imagen',
  },
  [FileUploadType.MODEL_3D]: {
    allowedMimeTypes: [
      'model/gltf-binary',
      'application/octet-stream', // .glb a veces llega como octet-stream
    ],
    allowedExtensions: ['glb'],
    maxSizeBytes: 15 * 1024 * 1024, // 15 MB
    label: 'Archivo 3D',
  },
  [FileUploadType.DOCUMENT]: {
    allowedMimeTypes: ['application/pdf'],
    allowedExtensions: ['pdf'],
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    label: 'Documento',
  },
  workshops: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    label: 'Imagen de Taller',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extrae la extensión (sin punto) del nombre de archivo en minúsculas.
 */
function getExtension(originalname: string): string {
  // extname devuelve '.glb', eliminamos el punto inicial y convertimos a minúsculas
  return extname(originalname).slice(1).toLowerCase();
}

// ─── Validadores públicos ─────────────────────────────────────────────────────

/**
 * validateFile
 * Valida el tipo MIME, la extensión y el tamaño del archivo.
 * Lanza BadRequestException si alguna condición no se cumple.
 *
 * @param file  - Archivo recibido de Multer
 * @param type  - Tipo de asset esperado
 */
export function validateFile(
  file: Express.Multer.File,
  type: AssetType,
): void {
  if (!file) {
    throw new BadRequestException('No se recibió ningún archivo.');
  }

  const constraints = CONSTRAINTS[type];
  const extension = getExtension(file.originalname);

  // 1. Validar extensión
  if (!constraints.allowedExtensions.includes(extension)) {
    throw new BadRequestException(
      `${constraints.label}: extensión ".${extension}" no permitida. ` +
        `Extensiones válidas: ${constraints.allowedExtensions.map((e) => `.${e}`).join(', ')}.`,
    );
  }

  // 2. Validar tipo MIME
  if (!constraints.allowedMimeTypes.includes(file.mimetype)) {
    throw new BadRequestException(
      `${constraints.label}: tipo MIME "${file.mimetype}" no permitido.`,
    );
  }

  // 3. Validar tamaño
  if (file.size > constraints.maxSizeBytes) {
    const maxMb = constraints.maxSizeBytes / (1024 * 1024);
    throw new BadRequestException(
      `${constraints.label}: el archivo supera el límite de ${maxMb} MB ` +
        `(recibido: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
    );
  }
}
