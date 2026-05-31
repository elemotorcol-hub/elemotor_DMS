import { IsEnum, IsInt, IsNotEmpty, IsPositive, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DocumentType } from '@prisma/client';

/**
 * DTO para subir un documento a Cloudinary y asociarlo a un pedido.
 * Los campos del body acompañan al archivo en el multipart/form-data.
 */
export class UploadDocumentDto {
  @ApiProperty({
    example: 1,
    description: 'ID del pedido al que se asocia el documento',
  })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  @Type(() => Number)
  orderId: number;

  @ApiProperty({
    enum: DocumentType,
    example: DocumentType.soat,
    description: 'Tipo de documento',
  })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  type: DocumentType;

  @ApiProperty({
    example: 'SOAT 2026',
    description: 'Nombre descriptivo del documento',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}
