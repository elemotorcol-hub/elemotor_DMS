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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { QueryMaintenanceDto } from './dto/query-maintenance.dto';

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
}
