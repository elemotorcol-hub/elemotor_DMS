import { Injectable } from '@nestjs/common';
import { Prisma, QuoteStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QueryQuoteDto } from './dto/query-quote.dto';
import { QueryMyQuoteDto } from './dto/query-my-quote.dto';

// ─── Projection helpers ────────────────────────────────────────────────────────

/** Admin list — lightweight, no message/notes body text */
export const QUOTE_LIST_SELECT = {
  id: true,
  referenceCode: true,
  status: true,
  name: true,
  email: true,
  phone: true,
  city: true,
  country: true,
  modelInterest: true,
  budgetRange: true,
  trackingCode: true,
  source: true,
  preferredChannel: true,
  utmSource: true,
  utmMedium: true,
  utmCampaign: true,
  createdAt: true,
  updatedAt: true,
  user:       { select: { id: true, name: true, email: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
  model:      { select: { id: true, name: true, slug: true } },
  trim:       { select: { id: true, name: true } },
} satisfies Prisma.QuoteSelect;

/** Admin detail — full content including message and notes */
export const QUOTE_DETAIL_SELECT = {
  ...QUOTE_LIST_SELECT,
  message: true,
  notes: true,
  budgetRange: true,
  model: {
    select: {
      id: true,
      name: true,
      slug: true,
      year: true,
      type: true,
      brand: { select: { id: true, name: true, slug: true } },
    },
  },
  trim: { select: { id: true, name: true, price: true, status: true } },
} satisfies Prisma.QuoteSelect;

export const QUOTE_MY_LIST_SELECT = {
  id: true,
  referenceCode: true,
  status: true,
  budgetRange: true,
  city: true,
  message: true,
  preferredChannel: true,
  createdAt: true,
  model: {
    select: {
      id: true,
      name: true,
      brand: { select: { name: true } },
      trims: { select: { images: true }, take: 1 }
    }
  },
  trim: {
    select: { id: true, name: true, images: true }
  },
} satisfies Prisma.QuoteSelect;

// ─── Repository ───────────────────────────────────────────────────────────────

/**
 * QuotesRepository
 *
 * Single responsibility: all data-access for the quotes module.
 * The service layer never touches PrismaService directly (DIP).
 */
@Injectable()
export class QuotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Reference code generation ──────────────────────────────────────────────

  /**
   * generateReferenceCode — Atomically generates COT-YYYY-NNNNN.
   *
   * Uses the same upsert+increment technique as TrackingCounter
   * to guarantee uniqueness even under concurrent requests.
   */
  async generateReferenceCode(year: number): Promise<string> {
    const counter = await this.prisma.$transaction(async (tx) => {
      await tx.quoteCounter.upsert({
        where:  { year },
        create: { year, lastSeq: 0 },
        update: {},
      });

      return tx.quoteCounter.update({
        where:  { year },
        data:   { lastSeq: { increment: 1 } },
        select: { lastSeq: true },
      });
    });

    const seq = counter.lastSeq.toString().padStart(5, '0');
    return `COT-${year}-${seq}`;
  }

  // ─── Create ─────────────────────────────────────────────────────────────────

  async create(dto: CreateQuoteDto, referenceCode: string, userId?: number) {
    return this.prisma.quote.create({
      data: {
        userId:          userId ?? null,
        name:            dto.name,
        email:           dto.email,
        phone:           dto.phone,
        city:            dto.city,
        country:         dto.country,
        trackingCode:    dto.trackingCode,
        modelId:         dto.modelId,
        trimId:          dto.trimId,
        budgetRange:     dto.budgetRange,
        preferredChannel: dto.preferredChannel,
        message:         dto.message,
        source:          dto.source,
        referenceCode,
        utmSource:   dto.utmSource,
        utmMedium:   dto.utmMedium,
        utmCampaign: dto.utmCampaign,
        status:      QuoteStatus.pending,
      },
      select: QUOTE_DETAIL_SELECT,
    });
  }

  // ─── Read — Admin ────────────────────────────────────────────────────────────

  /** Builds the Prisma WHERE clause from admin query filters */
  private buildWhere(filters: QueryQuoteDto): Prisma.QuoteWhereInput {
    const where: Prisma.QuoteWhereInput = {};

    if (filters.status)       where.status       = filters.status;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.source)       where.source       = filters.source;
    if (filters.email)        where.email        = filters.email;

    if (filters.from || filters.to) {
      where.createdAt = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to   ? { lte: new Date(filters.to)   } : {}),
      };
    }

    return where;
  }

  async findMany(filters: QueryQuoteDto) {
    const page   = filters.page  ?? 1;
    const limit  = filters.limit ?? 10;
    const skip   = (page - 1) * limit;
    const sortBy = filters.sortBy ?? 'createdAt';
    const order  = filters.order  ?? 'desc';
    const where  = this.buildWhere(filters);

    return this.prisma.quote.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { [sortBy]: order },
      select:  QUOTE_LIST_SELECT,
    });
  }

  async count(filters: QueryQuoteDto): Promise<number> {
    return this.prisma.quote.count({ where: this.buildWhere(filters) });
  }

  /** Admin detail with full model/trim relation */
  async findByIdAdmin(id: number) {
    return this.prisma.quote.findUnique({
      where:  { id },
      select: QUOTE_DETAIL_SELECT,
    });
  }

  /** Lightweight existence check to avoid over-fetching before updates */
  async checkExistence(id: number) {
    return this.prisma.quote.findUnique({
      where:  { id },
      select: { id: true, status: true },
    });
  }

  // ─── Read — Client ────────────────────────────────────────────────────────

  async findByUserId(userId: number, filters: QueryMyQuoteDto) {
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 10;
    const skip  = (page - 1) * limit;

    const where: Prisma.QuoteWhereInput = { userId };

    const [data, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        select:  QUOTE_MY_LIST_SELECT,
      }),
      this.prisma.quote.count({ where }),
    ]);

    return { data, total };
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateQuoteDto) {
    return this.prisma.quote.update({
      where: { id },
      data: {
        ...(dto.status        !== undefined ? { status:        dto.status        } : {}),
        ...(dto.assignedToId  !== undefined ? { assignedToId:  dto.assignedToId  } : {}),
        ...(dto.notes         !== undefined ? { notes:         dto.notes         } : {}),
        ...(dto.modelInterest !== undefined ? { modelInterest: dto.modelInterest } : {}),
        ...(dto.budgetRange   !== undefined ? { budgetRange:   dto.budgetRange   } : {}),
        ...(dto.name          !== undefined ? { name:          dto.name          } : {}),
        ...(dto.email         !== undefined ? { email:         dto.email         } : {}),
        ...(dto.phone         !== undefined ? { phone:         dto.phone         } : {}),
      },
      select: QUOTE_DETAIL_SELECT,
    });
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  /**
   * getStats — Returns aggregated metrics for the admin dashboard.
   *
   * Uses Promise.all to run all queries in parallel for performance.
   */
  async getStats() {
    const today      = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay   = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [totalToday, byStatus, bySource, total] = await Promise.all([
      // Today's quotes count
      this.prisma.quote.count({
        where: { createdAt: { gte: startOfDay, lt: endOfDay } },
      }),

      // Count grouped by status
      this.prisma.quote.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),

      // Count grouped by source (non-null sources)
      this.prisma.quote.groupBy({
        by: ['source'],
        _count: { _all: true },
        where: { source: { not: null } },
      }),

      // All-time total
      this.prisma.quote.count(),
    ]);

    return {
      total,
      totalToday,
      byStatus: byStatus.map((g) => ({
        status: g.status,
        count:  g._count._all,
      })),
      bySource: bySource.map((g) => ({
        source: g.source,
        count:  g._count._all,
      })),
    };
  }

  // ─── Quote Claim ───────────────────────────────────────────────────────────

  /**
   * claimAnonymousByEmail
   *
   * Called once during user registration to link pre-existing anonymous quotes
   * (created via the public POST /api/quotes endpoint) to the new user account.
   *
   * Uses a single atomic UPDATE — no extra SELECT round-trips:
   *   UPDATE quotes SET user_id = :userId
   *   WHERE email = :email AND user_id IS NULL
   *
   * @param email  The email of the newly registered user.
   * @param userId The ID of the newly created user record.
   * @returns      The number of quotes that were linked.
   */
  async claimAnonymousByEmail(email: string, userId: number): Promise<number> {
    const result = await this.prisma.quote.updateMany({
      where: {
        email,
        userId: null,
      },
      data: { userId },
    });

    return result.count;
  }

  // ─── Tracking Linkage ──────────────────────────────────────────────────────

  /**
   * findByTrackingCodeAndEmail — Validates that a quote exists for a specific
   * unassigned order code and matching client email.
   */
  async findByTrackingCodeAndEmail(trackingCode: string, email: string) {
    return this.prisma.quote.findFirst({
      where: {
        trackingCode,
        email,
      },
      select: { id: true },
    });
  }

  /**
   * updateTrackingCode — Allows linking a quote to an order's tracking code.
   */
  async updateTrackingCode(id: number, trackingCode: string) {
    return this.prisma.quote.update({
      where: { id },
      data: { trackingCode },
    });
  }
}
