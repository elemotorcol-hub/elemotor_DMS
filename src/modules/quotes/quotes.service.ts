import { Injectable, NotFoundException } from '@nestjs/common';
import { QuotesRepository } from './quotes.repository';
import { QuotesWebhookService } from './webhook/quotes-webhook.service';
import { UsersRepository } from '../users/users.repository';
import { OrdersRepository } from '../orders/orders.repository';
import { MailService } from '../mail/mail.service';
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
    private readonly usersRepository: UsersRepository,
    private readonly ordersRepository: OrdersRepository,
    private readonly mailService: MailService,
  ) {}

  // ─── Public: Create quote ─────────────────────────────────────────────────

  /**
   * create — Generates COT-YYYY-NNNNN atomically, persists the quote,
   * handles user identification/creation, links unassigned orders via trackingCode,
   * then fires a fire-and-forget webhook to n8n.
   *
   * @param dto Validated quote creation payload.
   */
  async create(dto: CreateQuoteDto) {
    const year = new Date().getFullYear();
    const referenceCode = await this.quotesRepository.generateReferenceCode(year);

    let userId: number | undefined;

    // 1. Identify user or create a temporary client account
    const existingUser = await this.usersRepository.findByEmail(dto.email);
    if (existingUser) {
      userId = existingUser.id;
    } else {
      const newUser = await this.usersRepository.createClient({
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        city: dto.city,
      });
      userId = newUser.id;
    }

    // 2. Optional: Link with trackingCode if provided
    if (dto.trackingCode) {
      const order = await this.ordersRepository.findByTrackingCodeOnly(dto.trackingCode);
      if (order && !order.userId) {
         // Reassign anonymous or system-created order to this user
        await this.ordersRepository.assignToUserId(order.id, userId);
      }
    }

    // 3. Persist the quote
    const quote = await this.quotesRepository.create(dto, referenceCode, userId);

    // 4. Email notification fire-and-forget
    this.mailService.sendQuoteNotification({
      referenceCode: quote.referenceCode ?? referenceCode,
      name: quote.name,
      email: quote.email,
      phone: quote.phone ?? '',
      city: quote.city,
      modelName: quote.model?.name ?? null,
      trimName: quote.trim?.name ?? null,
      preferredChannel: quote.preferredChannel,
      source: quote.source,
    }).catch((err) => {
      // Non-blocking: log but don't fail the request
      console.error('Error enviando notificación de cotización por email:', err);
    });

    // 5. Webhook fire-and-forget: does not block the HTTP response
    this.webhookService.fire({
      quoteId: quote.id,
      referenceCode: quote.referenceCode,
      name: quote.name,
      email: quote.email,
      phone: quote.phone,
      preferredChannel: quote.preferredChannel,
      modelId: quote.model?.id ?? null,
      trimId: quote.trim?.id ?? null,
      utmSource: quote.utmSource,
      utmMedium: quote.utmMedium,
      utmCampaign: quote.utmCampaign,
      source: quote.source,
      status: quote.status,
      timestamp: new Date().toISOString(),
    });

    return quote;
  }

  // ─── Read — Admin ──────────────────────────────────────────────────────────

  async findAll(query: QueryQuoteDto): Promise<PaginatedResult<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [data, total] = await Promise.all([
      this.quotesRepository.findMany(query),
      this.quotesRepository.count(query),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const quote = await this.quotesRepository.findByIdAdmin(id);
    if (!quote) throw new NotFoundException(`Cotización #${id} no encontrada`);
    return quote;
  }

  // ─── Update — Admin ────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateQuoteDto) {
    const exists = await this.quotesRepository.checkExistence(id);
    if (!exists) throw new NotFoundException(`Cotización #${id} no encontrada`);

    const updated = await this.quotesRepository.update(id, dto);

    // If status changed to won/lost, we could trigger other side effects here
    return updated;
  }

  // ─── Read — Client ────────────────────────────────────────────────────────

  async findMyQuotes(userId: number, query: QueryMyQuoteDto): Promise<PaginatedResult<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const { data, total } = await this.quotesRepository.findByUserId(userId, query);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Stats — Admin ────────────────────────────────────────────────────────

  async getStats() {
    return this.quotesRepository.getStats();
  }

  // ─── Public quote document ────────────────────────────────────────────────

  /**
   * findPublic — Retorna la cotización pública por referenceCode.
   * No expone email ni teléfono del cliente.
   */
  async findPublic(referenceCode: string) {
    const quote = await this.quotesRepository.findByReferenceCodePublic(referenceCode);
    if (!quote) throw new NotFoundException(`Cotización ${referenceCode} no encontrada`);
    return quote;
  }
}
