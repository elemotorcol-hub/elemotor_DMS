import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { ITokenPayload } from '../auth/interfaces/token-payload.interface';

/** Request with JWT payload injected by JwtAuthGuard */
interface AuthRequest {
  user: ITokenPayload;
}

/**
 * NotificationsController
 *
 * Expone la API de notificaciones bajo /api/notifications.
 *
 * IMPORTANTE: la ruta estática /unread-count debe declararse ANTES
 * de la ruta dinámica /:id para evitar conflictos de routing.
 */
@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ══════════════════════════════════════════════════════════════════════════
  // GET /notifications — Mis notificaciones (últimas 50)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/notifications
   * Usuario autenticado — retorna sus últimas 50 notificaciones.
   */
  @Get()
  @ApiOperation({ summary: '[Auth] Obtener mis notificaciones (últimas 50)' })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  getMyNotifications(@Req() req: AuthRequest) {
    return this.notificationsService.getMyNotifications(req.user.sub);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GET /notifications/unread-count — Conteo de no leídas (ruta estática primero)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/notifications/unread-count
   * Usuario autenticado — retorna solo el conteo de notificaciones no leídas.
   */
  @Get('unread-count')
  @ApiOperation({ summary: '[Auth] Conteo de notificaciones no leídas' })
  @ApiResponse({
    status: 200,
    description: 'Conteo de notificaciones no leídas',
    schema: { example: { unreadCount: 3 } },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  getUnreadCount(@Req() req: AuthRequest) {
    return this.notificationsService.getUnreadCount(req.user.sub);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // POST /notifications/read-all — Marcar todas como leídas
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/notifications/read-all
   * Usuario autenticado — marca todas sus notificaciones como leídas.
   */
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Auth] Marcar todas las notificaciones como leídas' })
  @ApiResponse({ status: 200, description: 'Todas las notificaciones marcadas como leídas' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  markAllRead(@Req() req: AuthRequest) {
    return this.notificationsService.markAllRead(req.user.sub);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PATCH /notifications/:id/read — Marcar una como leída
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * PATCH /api/notifications/:id/read
   * Usuario autenticado — marca una notificación específica como leída.
   */
  @Patch(':id/read')
  @ApiOperation({ summary: '[Auth] Marcar una notificación como leída' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  markRead(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthRequest,
  ) {
    return this.notificationsService.markRead(id, req.user.sub);
  }
}
