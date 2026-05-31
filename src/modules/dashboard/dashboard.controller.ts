import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@Roles(UserRole.admin, UserRole.super_admin)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: '[Admin] Resumen de métricas del dashboard' })
  @ApiResponse({ status: 200, description: 'Resumen de métricas, actividad y gráfica' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  getSummary() {
    return this.dashboardService.getSummary();
  }
}
