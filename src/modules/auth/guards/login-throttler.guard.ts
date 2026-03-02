import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * LoginThrottlerGuard — Rate limiting específico para el endpoint de login.
 *
 * Límite: 5 intentos por minuto por IP.
 * Responde 429 Too Many Requests si se supera el límite.
 * Configuración aplicada desde ThrottlerModule en AuthModule.
 */
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, any>): Promise<string> {
    // Rastrea por IP para prevenir ataques de fuerza bruta
    const ip: string =
      (req.headers?.['x-forwarded-for'] as string) ?? req.ip ?? 'unknown';
    return ip.split(',')[0].trim();
  }

  protected override errorMessage = 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 1 minuto.';
}
