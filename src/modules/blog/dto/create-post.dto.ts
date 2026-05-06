import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type PostStatusType = 'draft' | 'published';

export class CreatePostDto {
  @ApiProperty({ example: 'el-futuro-de-los-vehiculos-electricos' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  slug: string;

  @ApiProperty({ example: 'El futuro de los vehículos eléctricos en Colombia' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({ example: 'Descubre cómo los EVs están cambiando...' })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({ example: '<p>Contenido HTML del post...</p>' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/...' })
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional({ example: 'elemotor/blog/abc123' })
  @IsOptional()
  @IsString()
  coverPublicId?: string;

  @ApiPropertyOptional({ enum: ['draft', 'published'], default: 'draft' })
  @IsOptional()
  @IsEnum(['draft', 'published'])
  status?: PostStatusType;
}
