import { ApiProperty } from '@nestjs/swagger';

/**
 * UploadResultDto
 * Respuesta estandarizada para todos los métodos del UploadService.
 */
export class UploadResultDto {
  @ApiProperty({
    description: 'URL pública del archivo en Cloudinary',
    example: 'https://res.cloudinary.com/my-cloud/image/upload/v1/elemotor/vehicles/abc123.jpg',
  })
  publicUrl: string;

  @ApiProperty({
    description: 'Identificador único del recurso en Cloudinary',
    example: 'elemotor/vehicles/abc123',
  })
  publicId: string;

  @ApiProperty({
    description: 'Formato / extensión del archivo',
    example: 'jpg',
  })
  format: string;

  @ApiProperty({
    description: 'Tamaño del archivo en bytes',
    example: 204800,
  })
  size: number;
}
