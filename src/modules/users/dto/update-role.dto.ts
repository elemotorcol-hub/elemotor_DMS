import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

/**
 * DTO para cambiar el rol de un usuario.
 * Solo puede ser ejecutado por un super_admin.
 */
export class UpdateRoleDto {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.admin,
    description: 'Nuevo rol a asignar al usuario',
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
