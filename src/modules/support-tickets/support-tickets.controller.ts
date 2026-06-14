import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
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
import { TicketStatus, UserRole } from '@prisma/client';
import { SupportTicketsService } from './support-tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { ITokenPayload } from '../auth/interfaces/token-payload.interface';

/** Request with JWT payload injected by JwtAuthGuard */
interface AuthRequest {
  user: ITokenPayload;
}

/**
 * SupportTicketsController
 *
 * Expone la API de tickets de soporte bajo /api/support-tickets.
 *
 * IMPORTANTE: las rutas estáticas (/mine) deben declararse ANTES
 * de las rutas dinámicas (/:id) para evitar conflictos de routing.
 */
@ApiTags('support-tickets')
@ApiBearerAuth()
@Controller('support-tickets')
export class SupportTicketsController {
  constructor(private readonly supportTicketsService: SupportTicketsService) {}

  // ══════════════════════════════════════════════════════════════════════════
  // CLIENT — Crear ticket (cualquier usuario autenticado)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/support-tickets
   * Cualquier usuario autenticado puede abrir un ticket.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[Auth] Crear ticket de soporte' })
  @ApiResponse({ status: 201, description: 'Ticket creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  create(@Body() dto: CreateTicketDto, @Req() req: AuthRequest) {
    return this.supportTicketsService.create(req.user.sub, dto);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CLIENT — Ruta estática declarada ANTES de /:id
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/support-tickets/mine
   * Lista los tickets del usuario autenticado.
   */
  @Get('mine')
  @ApiOperation({ summary: '[Client] Listar mis tickets de soporte' })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'page',   required: false, type: Number })
  @ApiQuery({ name: 'limit',  required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de tickets del usuario' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  findMine(@Query() query: QueryTicketsDto, @Req() req: AuthRequest) {
    return this.supportTicketsService.findAllByUser(req.user.sub, query);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN — Listar todos los tickets
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/support-tickets
   * Solo admin/super_admin — lista todos los tickets con filtros.
   */
  @Get()
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: '[Admin] Listar todos los tickets de soporte' })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'page',   required: false, type: Number })
  @ApiQuery({ name: 'limit',  required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de tickets' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  findAll(@Query() query: QueryTicketsDto) {
    return this.supportTicketsService.findAll(query);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AUTH — Detalle de ticket (con verificación de acceso en el service)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/support-tickets/:id
   * Cualquier usuario autenticado — el service verifica si es owner o admin.
   */
  @Get(':id')
  @ApiOperation({ summary: '[Auth] Detalle de ticket (owner o admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Detalle del ticket con todos sus mensajes' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin acceso a este ticket' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthRequest,
  ) {
    return this.supportTicketsService.findOne(id, req.user.sub, req.user.role);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AUTH — Agregar mensaje
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/support-tickets/:id/messages
   * Cualquier usuario autenticado — el service verifica si es owner o admin.
   */
  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[Auth] Agregar mensaje a un ticket' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 201, description: 'Mensaje agregado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin acceso a este ticket' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  addMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddMessageDto,
    @Req() req: AuthRequest,
  ) {
    return this.supportTicketsService.addMessage(id, req.user.sub, req.user.role, dto);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN — Actualizar estado del ticket
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * PATCH /api/support-tickets/:id/status
   * Solo admin/super_admin — actualiza el estado del ticket.
   */
  @Patch(':id/status')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: '[Admin] Actualizar estado de un ticket' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return this.supportTicketsService.updateStatus(id, dto);
  }
}
