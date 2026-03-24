import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { QuoteStatus, UserRole } from '@prisma/client';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QueryQuoteDto } from './dto/query-quote.dto';
import { QueryMyQuoteDto } from './dto/query-my-quote.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ITokenPayload } from '../auth/interfaces/token-payload.interface';

/** Request with JWT payload injected by JwtAuthGuard */
interface AuthRequest {
  user: ITokenPayload;
}

/**
 * QuotesController
 *
 * Exposes the Quotes (leads) API under /api/quotes.
 *
 * IMPORTANT: static routes (/my, /stats) MUST be declared BEFORE the
 * dynamic route (/:id) to prevent routing conflicts in NestJS/Express.
 */
@ApiTags('quotes')
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  // ══════════════════════════════════════════════════════════════════════════
  // PUBLIC ENDPOINT
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/quotes
   * Public endpoint — creates a new quote/lead.
   * Generates reference_code COT-YYYY-NNNNN and fires n8n webhook.
   */
  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[Público] Crear cotización (lead)' })
  @ApiResponse({
    status: 201,
    description: 'Cotización creada. reference_code generado automáticamente.',
    schema: {
      example: {
        id: 1,
        referenceCode: 'COT-2026-00001',
        status: 'pending',
        name: 'Juan Pérez',
        email: 'juan@elemotor.co',
        preferredChannel: 'whatsapp',
        createdAt: '2026-03-05T14:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() dto: CreateQuoteDto) {
    return this.quotesService.create(dto);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CLIENT ENDPOINTS — static routes declared BEFORE /:id
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/quotes/my
   * Authenticated client — returns own quotes (paginated).
   */
  @Get('my')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Cliente] Listar mis cotizaciones' })
  @ApiQuery({ name: 'page',  required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Cotizaciones del usuario autenticado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  findMyQuotes(@Query() query: QueryMyQuoteDto, @Req() req: AuthRequest) {
    return this.quotesService.findMyQuotes(req.user.sub, query);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN ENDPOINTS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/quotes/stats
   * Admin only — returns aggregate metrics (today, by status, by source).
   */
  @Get('stats')
  @ApiBearerAuth()
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: '[Admin] Métricas de cotizaciones' })
  @ApiResponse({
    status: 200,
    description: 'Métricas agregadas',
    schema: {
      example: {
        total: 120,
        totalToday: 5,
        byStatus: [
          { status: 'pending',    count: 60 },
          { status: 'contacted',  count: 30 },
          { status: 'responded',  count: 15 },
          { status: 'closed_won', count: 10 },
          { status: 'closed_lost',count: 5  },
        ],
        bySource: [
          { source: 'web',       count: 80 },
          { source: 'whatsapp',  count: 25 },
          { source: 'instagram', count: 15 },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  getStats() {
    return this.quotesService.getStats();
  }

  /**
   * GET /api/quotes
   * Admin only — lists all quotes with filters and pagination.
   */
  @Get()
  @ApiBearerAuth()
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: '[Admin] Listar todas las cotizaciones con filtros y paginación' })
  @ApiQuery({ name: 'status',       required: false, enum: QuoteStatus })
  @ApiQuery({ name: 'assignedToId', required: false, type: Number })
  @ApiQuery({ name: 'source',       required: false, type: String })
  @ApiQuery({ name: 'from',         required: false, type: String, description: 'ISO date: 2026-01-01' })
  @ApiQuery({ name: 'to',           required: false, type: String, description: 'ISO date: 2026-12-31' })
  @ApiQuery({ name: 'sortBy',       required: false, enum: ['createdAt', 'updatedAt'] })
  @ApiQuery({ name: 'order',        required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page',         required: false, type: Number })
  @ApiQuery({ name: 'limit',        required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de cotizaciones' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  findAll(@Query() query: QueryQuoteDto) {
    return this.quotesService.findAll(query);
  }

  /**
   * GET /api/quotes/:id
   * Admin only — full detail including model relation.
   */
  @Get(':id')
  @ApiBearerAuth()
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: '[Admin] Detalle completo de una cotización' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Detalle de la cotización' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  @ApiResponse({ status: 404, description: 'Cotización no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.quotesService.findOne(id);
  }

  /**
   * PUT /api/quotes/:id
   * Admin only — updates status, assigned advisor and/or notes.
   */
  @Put(':id')
  @ApiBearerAuth()
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: '[Admin] Actualizar estado, asignación y notas de una cotización' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Cotización actualizada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  @ApiResponse({ status: 404, description: 'Cotización no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuoteDto,
  ) {
    return this.quotesService.update(id, dto);
  }
}
