import { SetMetadata } from '@nestjs/common';

/** Clave de metadatos para marcar rutas como públicas (omiten JwtAuthGuard) */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorador @Public()
 *
 * Marca un endpoint como público, omitiendo el JwtAuthGuard global.
 * Úsalo en endpoints que no requieren autenticación.
 *
 * @example
 * @Public()
 * @Post('register')
 * register(@Body() dto: RegisterDto) { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
