import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

/**
 * CLOUDINARY_CLIENT — token de inyección del SDK de Cloudinary.
 * Inyectado automáticamente por UploadModule en los proveedores.
 */
export const CLOUDINARY_CLIENT = 'CLOUDINARY_CLIENT';

/**
 * CloudinaryProvider
 * Inicializa el SDK de Cloudinary con las credenciales provenientes
 * de las variables de entorno (vía ConfigService).
 * Retorna la instancia configurada (v2) para inyección en servicios.
 */
export const CloudinaryProvider: FactoryProvider = {
  provide: CLOUDINARY_CLIENT,
  useFactory: (config: ConfigService) => {
    const cloudName = config.get<string>('cloudinary.cloudName');
    const apiKey = config.get<string>('cloudinary.apiKey');
    const apiSecret = config.get<string>('cloudinary.apiSecret');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'Cloudinary credentials (CLOUD_NAME, API_KEY, API_SECRET) are missing and required.',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true, // Siempre HTTPS
    });
    return cloudinary;
  },
  inject: [ConfigService],
};
