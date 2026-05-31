import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OrderWebhookPayload {
  orderId: number;
  trackingCode: string | null;
  previousStatus: string | null;
  newStatus: string;
  changedById: number;
  timestamp: string;
}

/**
 * OrdersWebhookService
 *
 * Dispara un webhook HTTP POST asíncrono (fire-and-forget) al cambiar
 * el estado de un pedido. No bloquea el request del caller.
 *
 * Configuración:
 *   ORDER_WEBHOOK_URL — URL destino (opcional). Si no está definida,
 *   el servicio omite el envío silenciosamente.
 */
@Injectable()
export class OrdersWebhookService {
  private readonly logger = new Logger(OrdersWebhookService.name);
  private readonly webhookUrl: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.webhookUrl = this.config.get<string>('ORDER_WEBHOOK_URL');
  }

  /**
   * fire — Envía el payload al webhook de forma asíncrona.
   * Los errores se capturan y loguenan; nunca se propagan al caller.
   */
  fire(payload: OrderWebhookPayload): void {
    if (!this.webhookUrl) return;

    // setImmediate garantiza que el código se ejecuta fuera del ciclo
    // de request actual sin bloquear la respuesta HTTP al cliente.
    setImmediate(() => {
      fetch(this.webhookUrl as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5_000), // timeout 5 s
      })
        .then(async (res) => {
          // CRÍTICO: Consumir el body de la respuesta para evitar fugas de memoria
          // (socket leaks) en la API fetch de Node.js, incluso si falla.
          try {
            await res.text();
          } catch {}

          if (!res.ok) {
            this.logger.warn(
              `Webhook respondió con status ${res.status} para order #${payload.orderId}`,
            );
          }
        })
        .catch((err: unknown) => {
          this.logger.error(
            `Error disparando webhook para order #${payload.orderId}`,
            err instanceof Error ? err.message : String(err),
          );
        });
    });
  }
}
