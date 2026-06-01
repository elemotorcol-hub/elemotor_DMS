import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { QueryMaintenanceDto } from './dto/query-maintenance.dto';
import { QueryAdminMaintenanceDto } from './dto/query-admin-maintenance.dto';
import { Roles } from '../auth/decorators/roles.decorator';

interface AuthRequest {
  user: { sub: number };
}

@ApiTags('maintenance')
@ApiBearerAuth()
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  /**
   * POST /api/maintenance
   * Marca un mantenimiento como realizado.
   * Solo permitido si el pedido está en estado "delivered".
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[Cliente] Registrar un mantenimiento realizado' })
  @ApiResponse({ status: 201, description: 'Registro creado exitosamente.' })
  @ApiResponse({ status: 403, description: 'El vehículo aún no ha sido entregado.' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado o sin pertenencia.' })
  create(@Body() dto: CreateMaintenanceDto, @Req() req: AuthRequest) {
    return this.maintenanceService.createRecord(req.user.sub, dto);
  }

  /**
   * GET /api/maintenance?orderId=X
   * Retorna el historial de mantenimientos del cliente para un pedido.
   */
  @Get()
  @ApiOperation({ summary: '[Cliente] Historial de mantenimientos por pedido' })
  @ApiQuery({ name: 'orderId', type: Number, required: true })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Lista paginada de registros de mantenimiento.' })
  findAll(@Query() query: QueryMaintenanceDto, @Req() req: AuthRequest) {
    return this.maintenanceService.findRecords(req.user.sub, query);
  }

  /**
   * GET /api/maintenance/summary?orderId=X
   * Retorna el total gastado y el número de mantenimientos.
   */
  @Get('summary')
  @ApiOperation({ summary: '[Cliente] Resumen de costos de mantenimiento' })
  @ApiQuery({ name: 'orderId', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Resumen con total gastado y número de registros.' })
  getSummary(
    @Query('orderId', ParseIntPipe) orderId: number,
    @Req() req: AuthRequest,
  ) {
    return this.maintenanceService.getSummary(req.user.sub, orderId);
  }

  // ══════════════════════════════════════════════════════
  // ADMIN — solo admin / super_admin
  // ══════════════════════════════════════════════════════

  /**
   * GET /api/maintenance/admin/clients/:userId
   * Historial completo de mantenimiento de un cliente.
   * Respuesta incluye workshop.latitude y workshop.longitude para renderizar mapa.
   * Filtros opcionales: orderId, type, page, limit.
   */
  @Get('admin/clients/:userId')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: '[Admin] Tabla de mantenimiento + mapa de talleres de un cliente' })
  @ApiParam({ name: 'userId', type: Number, description: 'ID del cliente' })
  @ApiQuery({ name: 'orderId', type: Number, required: false, description: 'Filtrar por pedido' })
  @ApiQuery({ name: 'type', type: String, required: false, description: 'Filtrar por tipo de mantenimiento' })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada con datos de taller (lat/lng) para vista de mapa.',
  })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador.' })
  findClientRecords(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: QueryAdminMaintenanceDto,
  ) {
    return this.maintenanceService.findClientRecords(userId, query);
  }

  /**
   * GET /api/maintenance/admin/clients/:userId/summary
   * Resumen total de costos de mantenimiento de un cliente (todos sus pedidos).
   */
  @Get('admin/clients/:userId/summary')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: '[Admin] Resumen de costos totales de mantenimiento de un cliente' })
  @ApiParam({ name: 'userId', type: Number, description: 'ID del cliente' })
  @ApiResponse({ status: 200, description: 'Total gastado y número de registros.' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador.' })
  getClientSummary(@Param('userId', ParseIntPipe) userId: number) {
    return this.maintenanceService.getClientSummary(userId);
  }
}
