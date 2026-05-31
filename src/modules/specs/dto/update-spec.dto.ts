import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateSpecDto } from './create-spec.dto';

/**
 * UpdateSpecDto — Todos los campos opcionales excepto trimId
 * (el trimId es inmutable una vez creada la Spec)
 */
export class UpdateSpecDto extends PartialType(
  OmitType(CreateSpecDto, ['trimId'] as const),
) {}
