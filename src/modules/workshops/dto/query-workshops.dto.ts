import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ServiceType } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryWorkshopsDto extends PaginationDto {
  @IsString()
  @IsOptional()
  city?: string;

  @IsEnum(ServiceType)
  @IsOptional()
  service_type?: ServiceType;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  lat?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  lng?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  radius?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeInactive?: boolean;
}
