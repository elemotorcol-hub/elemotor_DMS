import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  IsNumber,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ColorType, ImageType, Model3dFormat, LodLevel, TrimStatus } from '@prisma/client';

export class NestedSpecDto {
  @IsOptional()
  @Type(() => Number)
  dbId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  batteryKwh?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  rangeCltcKm?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  rangeWltpKm?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  horsepower?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  torque?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  zeroTo100?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  topSpeed?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  chargeTime3080?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  trunkLiters?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  lengthMm?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  widthMm?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  heightMm?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  wheelbaseMm?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  curbWeightKg?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  kwhPer100km?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  adasLevel?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  screenSize?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  softwareVersion?: number;
}

export class NestedColorDto {
  @IsOptional()
  @Type(() => Number)
  dbId?: number;

  @IsOptional()
  @IsBoolean()
  _deleted?: boolean;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.replace('#', '') : value)
  @MaxLength(6)
  hex_code: string;

  @IsEnum(ColorType)
  type: ColorType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  image_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  swatch_url?: string;
}

export class NestedImageDto {
  @IsOptional()
  @Type(() => Number)
  dbId?: number;

  @IsOptional()
  @IsBoolean()
  _deleted?: boolean;

  @IsString()
  @MaxLength(500)
  url: string;

  @IsString()
  @MaxLength(255)
  publicId: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt_text?: string;

  @IsEnum(ImageType)
  type: ImageType;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sort_order?: number;
}

export class NestedModel3dDto {
  @IsOptional()
  @Type(() => Number)
  dbId?: number;

  @IsOptional()
  @IsBoolean()
  _deleted?: boolean;

  @IsString()
  @MaxLength(500)
  file_url: string;

  @IsString()
  @MaxLength(255)
  publicId: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  file_size_mb?: number;

  @IsOptional()
  @IsEnum(Model3dFormat)
  format?: Model3dFormat;

  @IsOptional()
  @IsBoolean()
  draco_compressed?: boolean;

  @IsOptional()
  @IsEnum(LodLevel)
  lod_level?: LodLevel;
}

export class NestedTrimDto {
  @IsOptional()
  @Type(() => Number)
  dbId?: number;

  @IsOptional()
  @IsBoolean()
  _deleted?: boolean;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  available_quantity?: number;

  @IsEnum(TrimStatus)
  status: TrimStatus;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => NestedSpecDto)
  specs?: NestedSpecDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NestedColorDto)
  colors?: NestedColorDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NestedImageDto)
  images?: NestedImageDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => NestedModel3dDto)
  model_3d?: NestedModel3dDto;
}
