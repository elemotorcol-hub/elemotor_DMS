import { Injectable } from '@nestjs/common';
import { QuotesRepository } from '../quotes/quotes.repository';
import { OrdersRepository } from '../orders/orders.repository';
import { TrimsRepository } from '../trims/trims.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus, QuoteStatus, UserRole } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(
    private readonly quotesRepository: QuotesRepository,
    private readonly ordersRepository: OrdersRepository,
    private readonly trimsRepository: TrimsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);

    const [
      leadsToday,
      leadsWeekly,
      activeOrders,
      totalStock,
      recentQuotes,
      recentActivity,
      chartData,
      totalAsesores,
      totalClients,
      totalUsers,
    ] = await Promise.all([
      // 1. Leads Today
      this.prisma.quote.count({ where: { createdAt: { gte: today } } }),

      // 2. Leads Weekly
      this.prisma.quote.count({ where: { createdAt: { gte: startOfWeek } } }),

      // 3. Active Orders (Not delivered)
      this.prisma.order.count({
        where: { status: { not: OrderStatus.delivered } }
      }),

      // 4. Vehicles in Stock (Sum availableQuantity of stock trims)
      this.prisma.trim.aggregate({
        _sum: { availableQuantity: true },
        where: { status: 'stock', active: true },
      }),

      // 5. Recent Quotes (Last 10)
      this.quotesRepository.findMany({ page: 1, limit: 10 }),

      // 6. Recent Activity (Mix of Orders Status Changes and New Quotes)
      this.getRecentActivity(),

      // 7. Chart Data (Last 30 days daily counts)
      this.getChartData(last30Days),

      // 8. Total asesores (admin + super_admin)
      this.prisma.user.count({
        where: { role: { in: [UserRole.admin, UserRole.super_admin] } },
      }),

      // 9. Clientes con vehículo entregado (usuarios con al menos un pedido entregado)
      this.prisma.user.count({
        where: { orders: { some: { status: OrderStatus.delivered } } },
      }),

      // 10. Total usuarios registrados
      this.prisma.user.count(),
    ]);

    return {
      metrics: {
        leadsToday,
        leadsWeekly,
        activeOrders,
        vehiclesInStock: totalStock._sum.availableQuantity || 0,
        totalAsesores,
        totalClients,
        totalUsers,
      },
      recentQuotes: (recentQuotes as any).data || recentQuotes, // findMany returns PaginatedResult or Array depending on branch
      recentActivity,
      chartData,
    };
  }

  private async getRecentActivity() {
    // Get last 5 order status changes
    const orderActivity = await this.prisma.orderStatusHistory.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: { 
        order: { select: { trackingCode: true } }
      }
    });

    // Get last 5 new quotes
    const quoteActivity = await this.prisma.quote.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, referenceCode: true, createdAt: true }
    });

    // Combine and sort
    const combined = [
      ...orderActivity.map(a => ({
        id: `order-${a.id}`,
        type: 'order_status',
        message: `Pedido #${a.order.trackingCode} pasó a ${a.status}`,
        date: a.date,
      })),
      ...quoteActivity.map(q => ({
        id: `quote-${q.id}`,
        type: 'new_quote',
        message: `Nueva cotización #${q.referenceCode} de ${q.name}`,
        date: q.createdAt,
      }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);

    return combined;
  }

  private async getChartData(since: Date) {
    const quotes = await this.prisma.quote.groupBy({
      by: ['createdAt'],
      _count: { _all: true },
      where: { createdAt: { gte: since } },
    });

    // Post-process to group by day (as createdAt is a full timestamp)
    const dailyMap = new Map<string, number>();
    
    // Initialize last 30 days with 0
    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dailyMap.set(d.toISOString().split('T')[0], 0);
    }

    quotes.forEach(q => {
        const dateStr = q.createdAt.toISOString().split('T')[0];
        if (dailyMap.has(dateStr)) {
            dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + q._count._all);
        }
    });

    return Array.from(dailyMap.entries())
        .map(([date, count]) => ({ date, leads: count }))
        .sort((a, b) => a.date.localeCompare(b.date));
  }
}
