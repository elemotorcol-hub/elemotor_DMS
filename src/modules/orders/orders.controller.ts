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
import { UserRole, OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { QueryMyOrderDto } from './dto/query-my-order.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ITokenPayload } from '../auth/interfaces/token-payload.interface';

/** Petición HTTP con el payload JWT inyectado por JwtAuthGuard */
interface AuthRequest {
  user: ITokenPayload;
}

/**
 * OrdersController
 *
 * IMPORTANTE: las rutas estáticas (/my, /track) deben declararse ANTES de las
 * rutas con parámetro dinámico (:id) para evitar conflictos de enrutamiento.
 */
@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN ENDPOINTS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/orders
   * Crea un nuevo pedido de importación.
   * Genera tracking_code ELE-YYYY-NNNNN de forma atómica.
   */
  @Post()
  @Roles(UserRole.admin, UserRole.super_admin)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[Admin] Crear pedido de importación' })
  @ApiResponse({
    status: 201,
    description: 'Pedido creado con tracking_code autogenerado y estado "confirmed".',
    schema: {
      example: {
        id: 1,
        trackingCode: 'ELE-2026-00001',
        status: 'confirmed',
        vin: null,
        notes: 'Cliente prioritario',
        estimatedDelivery: '2026-07-15T00:00:00.000Z',
        createdAt: '2026-03-04T15:32:21.000Z',
        user: { id: 3, name: 'Juan Pérez', email: 'juan@elemotor.co' },
        trim: { id: 1, name: 'BYD Han EV Premium', model: { id: 1, name: 'Han', brand: { id: 1, name: 'BYD' } } },
        color: { id: 2, name: 'Blanco Perla', hexCode: 'FFFFFF' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos (vin, trimId, etc.)' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  create(@Body() dto: CreateOrderDto, @Req() req: AuthRequest) {
    return this.ordersService.create(dto, req.user.sub);
  }

  /**
   * GET /api/orders
   * Lista pedidos con filtros opcionales, paginación y ordenamiento.
   */
  @Get()
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: '[Admin] Listar todos los pedidos con filtros y paginación' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'ISO date: 2026-01-01' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'ISO date: 2026-12-31' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'estimatedDelivery'] })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista paginada de pedidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  findAll(@Query() query: QueryOrderDto) {
    return this.ordersService.findAll(query);
  }

  /**
   * PUT /api/orders/:id
   * Edita VIN, notas y fecha estimada. NO permite cambiar trackingCode ni userId.
   */
  @Put(':id')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: '[Admin] Editar VIN, notas y fecha estimada de un pedido' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Pedido actualizado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o campos no permitidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }

  /**
   * PUT /api/orders/:id/status
   * Cambia el estado del pedido y registra el historial.
   * Dispara webhook asincrónico sin bloquear la respuesta.
   */
  @Put(':id/status')
  @Roles(UserRole.admin, UserRole.super_admin)
  @ApiOperation({ summary: '[Admin] Cambiar estado del pedido (con historial + webhook)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado. Webhook disparado de forma asincrónica.',
  })
  @ApiResponse({ status: 400, description: 'Estado inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: AuthRequest,
  ) {
    return this.ordersService.changeStatus(id, dto, req.user.sub);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PUBLIC ENDPOINTS — sin autenticación
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/orders/track?trackingCode=ELE-2026-00001&identity=juan@email.com
   * Endpoint público — busca un pedido por código + cédula/correo.
   * No requiere JWT. Retorna 404 genérico si no coincide (no revela existencia).
   */
  @Get('track')
  @Public()
  @ApiOperation({ summary: '[Público] Rastrear pedido por código e identidad (cédula o email)' })
  @ApiQuery({ name: 'trackingCode', required: true, type: String, example: 'ELE-2026-00001' })
  @ApiQuery({ name: 'identity', required: true, type: String, example: 'juan@elemotor.co' })
  @ApiResponse({ status: 200, description: 'Detalle del pedido con historial de estados' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado o datos incorrectos' })
  trackPublic(
    @Query('trackingCode') trackingCode: string,
    @Query('identity') identity: string,
  ) {
    return this.ordersService.trackPublicly(trackingCode, identity);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CLIENT ENDPOINTS
  // ⚠️  Rutas estáticas PRIMERO: /my y /my/:id ANTES que /:id
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/orders/my
   * Retorna los pedidos del usuario autenticado con último estado.
   */
  @Get('my')
  @ApiOperation({ summary: '[Cliente] Listar mis pedidos con último estado' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Pedidos del usuario autenticado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  findMyOrders(@Query() query: QueryMyOrderDto, @Req() req: AuthRequest) {
    return this.ordersService.findMyOrders(req.user.sub, query);
  }

  /**
   * GET /api/orders/my/:id
   * Retorna el detalle de un pedido con historial completo.
   * Solo si el pedido pertenece al usuario autenticado (ownership check).
   */
  @Get('my/:id')
  @ApiOperation({
    summary: '[Cliente] Obtener detalle + historial de uno de mis pedidos',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Detalle del pedido con historial completo de estados',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado o no pertenece al usuario' })
  findMyOrder(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.ordersService.findMyOrder(id, req.user.sub);
  }
}


