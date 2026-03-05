import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface QuoteWebhookPayload {
  quoteId: number;
  referenceCode: string | null;
  name: string;
  email: string;
  phone: string | null;
  preferredChannel: string;
  modelId: number | null;
  trimId: number | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  source: string | null;
  status: string;
  timestamp: string;
}

/**
 * QuotesWebhookService
 *
 * Fires an asynchronous HTTP POST (fire-and-forget) to the n8n webhook
 * configured in QUOTE_WEBHOOK_URL whenever a new quote is created.
 * Errors are logged but never propagated to the caller — the API
 * response should never be delayed or blocked by the webhook.
 *
 * Configuration:
 *   QUOTE_WEBHOOK_URL — destination URL (optional). If absent, silently no-ops.
 */
@Injectable()
export class QuotesWebhookService {
  private readonly logger = new Logger(QuotesWebhookService.name);
  private readonly webhookUrl: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.webhookUrl = this.config.get<string>('QUOTE_WEBHOOK_URL');

    if (!this.webhookUrl) {
      this.logger.log(
        'QUOTE_WEBHOOK_URL no está definida. Las integraciones con n8n estarán deshabilitadas.',
      );
    } else {
      this.logger.log('Quotes Webhook Service initialized');
    }
  }

  /**
   * fire — Dispatches the payload to the webhook asynchronously.
   * Uses setImmediate to run outside the current request cycle,
   * ensuring the HTTP response to the client is not delayed.
   */
  fire(payload: QuoteWebhookPayload): void {
    if (!this.webhookUrl) return;

    setImmediate(() => {
      fetch(this.webhookUrl as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5_000), // 5 s hard timeout
      })
        .then(async (res) => {
          // Consume the response body to avoid socket/memory leaks
          try {
            await res.text();
          } catch {}

          if (!res.ok) {
            this.logger.warn(
              `Webhook responded with status ${res.status} for quote #${payload.quoteId}`,
            );
          }
        })
        .catch((err: unknown) => {
          this.logger.error(
            `Error firing webhook for quote #${payload.quoteId}`,
            err instanceof Error ? err.message : String(err),
          );
        });
    });
  }
}
