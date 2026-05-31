import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBrandDto {
  @ApiProperty({ example: 'BYD', description: 'Nombre de la marca' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'byd', description: 'Slug único de la marca' })
  @IsString()
  @MaxLength(255)
  slug: string;

  @ApiPropertyOptional({
    example: 'https://cdn.elemotor.co/logos/byd.png',
    description: 'URL del logotipo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'China', description: 'País de origen' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ default: true, description: 'Marca activa/inactiva' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
