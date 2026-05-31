import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * UploadModel3dDto
 *
 * DTO de campos de formulario para POST /api/models-3d/upload.
 * El archivo .glb se recibe via @UploadedFile() — no va en este DTO.
 */
export class UploadModel3dDto {
  @ApiProperty({ example: 1, description: 'ID del trim al que pertenece el modelo 3D' })
  @IsInt()
  @Type(() => Number)
  trimId: number;
}
