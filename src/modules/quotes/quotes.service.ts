import { Injectable, NotFoundException } from '@nestjs/common';
import { QuotesRepository } from './quotes.repository';
import { QuotesWebhookService } from './webhook/quotes-webhook.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QueryQuoteDto } from './dto/query-quote.dto';
import { QueryMyQuoteDto } from './dto/query-my-quote.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

/**
 * QuotesService
 *
 * Business-logic layer for the quotes module.
 * Delegates all data access to QuotesRepository (DIP) and
 * maintains single-responsibility per method (SRP).
 */
@Injectable()
export class QuotesService {
  constructor(
    private readonly quotesRepository: QuotesRepository,
    private readonly webhookService: QuotesWebhookService,
  ) {}

  // ─── Public: Create quote ─────────────────────────────────────────────────

  /**
   * create — Generates COT-YYYY-NNNNN atomically, persists the quote,
   * then fires a fire-and-forget webhook to n8n without blocking the response.
   *
   * @param dto     Validated quote creation payload.
   * @param userId  Optional — linked user ID if request is authenticated.
   */
  async create(dto: CreateQuoteDto, userId?: number) {
    const year          = new Date().getFullYear();
    const referenceCode = await this.quotesRepository.generateReferenceCode(year);
    const quote         = await this.quotesRepository.create(dto, referenceCode, userId);

    // Webhook fire-and-forget: does not block the HTTP response
    this.webhookService.fire({
      quoteId:          quote.id,
      referenceCode:    quote.referenceCode,
      name:             quote.name,
      email:            quote.email,
      phone:            quote.phone,
      preferredChannel: quote.preferredChannel,
      modelId:          quote.model?.id ?? null,
      trimId:           quote.trim?.id  ?? null,
      utmSource:        quote.utmSource   ?? null,
      utmMedium:        quote.utmMedium   ?? null,
      utmCampaign:      quote.utmCampaign ?? null,
      source:           quote.source      ?? null,
      status:           quote.status,
      timestamp:        new Date().toISOString(),
    });

    return quote;
  }

  // ─── Admin: List all quotes ──────────────────────────────────────────────

  async findAll(query: QueryQuoteDto): Promise<PaginatedResult<unknown>> {
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 10;

    const [data, total] = await Promise.all([
      this.quotesRepository.findMany(query),
      this.quotesRepository.count(query),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Admin: Quote detail ─────────────────────────────────────────────────

  async findOne(id: number) {
    const quote = await this.quotesRepository.findByIdAdmin(id);
    if (!quote) {
      throw new NotFoundException(`Cotización #${id} no encontrada`);
    }
    return quote;
  }

  // ─── Admin: Update quote ─────────────────────────────────────────────────

  async update(id: number, dto: UpdateQuoteDto) {
    const existing = await this.quotesRepository.checkExistence(id);
    if (!existing) {
      throw new NotFoundException(`Cotización #${id} no encontrada`);
    }
    return this.quotesRepository.update(id, dto);
  }

  // ─── Admin: Stats ─────────────────────────────────────────────────────────

  async getStats() {
    return this.quotesRepository.getStats();
  }

  // ─── Client: My quotes ───────────────────────────────────────────────────

  async findMyQuotes(
    userId: number,
    query: QueryMyQuoteDto,
  ): Promise<PaginatedResult<unknown>> {
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 10;

    const { data, total } = await this.quotesRepository.findByUserId(userId, query);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
