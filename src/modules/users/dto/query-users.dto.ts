import { IsOptional, IsEnum, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * QueryUsersDto — Filtros y paginación para GET /api/users (admin).
 */
export class QueryUsersDto extends PaginationDto {
  @ApiPropertyOptional({ enum: UserRole, description: 'Filtrar por rol' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    example: 'juan',
    description: 'Buscar por nombre o email (búsqueda parcial, insensible a mayúsculas)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
