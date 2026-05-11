import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, HttpException } from '@nestjs/common';

import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { OrdersWebhookService } from './webhook/orders-webhook.service';
import { QuotesRepository } from '../quotes/quotes.repository';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockOrdersRepository = {
  generateTrackingCode: jest.fn(),
  create: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  findByIdAdmin: jest.fn(),
  checkExistenceAndStatus: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  findByUserId: jest.fn(),
  findByIdAndUserId: jest.fn(),
  findPublicDetail: jest.fn(),
  findMyVehicle: jest.fn(),
  findDeliveredOrder: jest.fn(),
};

const mockWebhookService = {
  fire: jest.fn(),
};

const mockQuotesRepository = {};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockOrder = {
  id: 1,
  trackingCode: 'ELE-2026-00001',
  status: 'confirmed',
  userId: 3,
  trimId: 1,
  colorId: 2,
  vin: null,
  notes: null,
  estimatedDelivery: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: OrdersRepository,       useValue: mockOrdersRepository },
        { provide: OrdersWebhookService,   useValue: mockWebhookService },
        { provide: QuotesRepository,       useValue: mockQuotesRepository },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  // ══════════════════════════════════════════════════════════════════
  // create
  // ══════════════════════════════════════════════════════════════════

  describe('create', () => {
    const dto = { trimId: 1, colorId: 2 };

    it('genera un trackingCode si no se provee uno', async () => {
      mockOrdersRepository.generateTrackingCode.mockResolvedValue('ELE-2026-00001');
      mockOrdersRepository.create.mockResolvedValue(mockOrder);

      await service.create(dto, 99);

      expect(mockOrdersRepository.generateTrackingCode).toHaveBeenCalledWith(
        new Date().getFullYear(),
      );
      expect(mockOrdersRepository.create).toHaveBeenCalledWith(dto, 'ELE-2026-00001', 99);
    });

    it('usa el trackingCode provisto sin generar uno nuevo', async () => {
      const dtoWithCode = { ...dto, trackingCode: 'ELE-2025-00099' };
      mockOrdersRepository.create.mockResolvedValue({ ...mockOrder, trackingCode: 'ELE-2025-00099' });

      await service.create(dtoWithCode, 99);

      expect(mockOrdersRepository.generateTrackingCode).not.toHaveBeenCalled();
      expect(mockOrdersRepository.create).toHaveBeenCalledWith(dtoWithCode, 'ELE-2025-00099', 99);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // findAll
  // ══════════════════════════════════════════════════════════════════

  describe('findAll', () => {
    it('retorna datos paginados con meta correcta', async () => {
      mockOrdersRepository.findMany.mockResolvedValue([mockOrder]);
      mockOrdersRepository.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('usa page=1 y limit=10 por defecto', async () => {
      mockOrdersRepository.findMany.mockResolvedValue([]);
      mockOrdersRepository.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // findOne (admin)
  // ══════════════════════════════════════════════════════════════════

  describe('findOne', () => {
    it('retorna el pedido si existe', async () => {
      mockOrdersRepository.findByIdAdmin.mockResolvedValue(mockOrder);

      const result = await service.findOne(1);

      expect(result).toEqual(mockOrder);
    });

    it('lanza NotFoundException si el pedido no existe', async () => {
      mockOrdersRepository.findByIdAdmin.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // update (admin)
  // ══════════════════════════════════════════════════════════════════

  describe('update', () => {
    it('actualiza el pedido si existe', async () => {
      mockOrdersRepository.checkExistenceAndStatus.mockResolvedValue(mockOrder);
      mockOrdersRepository.update.mockResolvedValue({ ...mockOrder, vin: 'ABC123' });

      const result = await service.update(1, { vin: 'ABC123' });

      expect(result.vin).toBe('ABC123');
    });

    it('lanza NotFoundException si el pedido no existe', async () => {
      mockOrdersRepository.checkExistenceAndStatus.mockResolvedValue(null);

      await expect(service.update(999, { vin: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // changeStatus
  // ══════════════════════════════════════════════════════════════════

  describe('changeStatus', () => {
    it('lanza NotFoundException si el pedido no existe', async () => {
      mockOrdersRepository.checkExistenceAndStatus.mockResolvedValue(null);

      await expect(
        service.changeStatus(999, { status: 'transit' as any, description: '' }, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('actualiza el estado y dispara el webhook', async () => {
      mockOrdersRepository.checkExistenceAndStatus.mockResolvedValue(mockOrder);
      mockOrdersRepository.updateStatus.mockResolvedValue({ ...mockOrder, status: 'transit' });

      await service.changeStatus(1, { status: 'transit' as any, description: 'En tránsito' }, 5);

      expect(mockOrdersRepository.updateStatus).toHaveBeenCalledTimes(1);
      expect(mockWebhookService.fire).toHaveBeenCalledTimes(1);
    });

    it('el webhook se dispara con los datos correctos', async () => {
      mockOrdersRepository.checkExistenceAndStatus.mockResolvedValue(mockOrder);
      mockOrdersRepository.updateStatus.mockResolvedValue({ ...mockOrder, status: 'transit' });

      await service.changeStatus(1, { status: 'transit' as any, description: 'Despachado' }, 5);

      expect(mockWebhookService.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 1,
          trackingCode: 'ELE-2026-00001',
          previousStatus: 'confirmed',
          newStatus: 'transit',
          changedById: 5,
        }),
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // findMyOrders (cliente)
  // ══════════════════════════════════════════════════════════════════

  describe('findMyOrders', () => {
    it('retorna pedidos paginados del usuario', async () => {
      mockOrdersRepository.findByUserId.mockResolvedValue({ data: [mockOrder], total: 1 });

      const result = await service.findMyOrders(3, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // findMyOrder (cliente — un pedido con ownership check)
  // ══════════════════════════════════════════════════════════════════

  describe('findMyOrder', () => {
    it('retorna el pedido si pertenece al usuario', async () => {
      mockOrdersRepository.findByIdAndUserId.mockResolvedValue(mockOrder);

      const result = await service.findMyOrder(1, 3);

      expect(result).toEqual(mockOrder);
    });

    it('lanza NotFoundException si el pedido no pertenece al usuario', async () => {
      mockOrdersRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.findMyOrder(1, 99)).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // trackPublicly
  // ══════════════════════════════════════════════════════════════════

  describe('trackPublicly', () => {
    it('retorna el pedido si el código existe', async () => {
      mockOrdersRepository.findPublicDetail.mockResolvedValue(mockOrder);

      const result = await service.trackPublicly('ELE-2026-00001');

      expect(result).toEqual(mockOrder);
    });

    it('lanza NotFoundException si el código no existe', async () => {
      mockOrdersRepository.findPublicDetail.mockResolvedValue(null);

      await expect(service.trackPublicly('ELE-0000-99999')).rejects.toThrow(NotFoundException);
    });

    it('lanza HttpException (500) si ocurre un error inesperado', async () => {
      mockOrdersRepository.findPublicDetail.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.trackPublicly('ELE-2026-00001')).rejects.toThrow(HttpException);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // findMyVehicle (cliente)
  // ══════════════════════════════════════════════════════════════════

  describe('findMyVehicle', () => {
    it('retorna el vehículo si el usuario tiene un pedido activo', async () => {
      const mockVehicle = { ...mockOrder, trim: { name: 'BYD Han EV' } };
      mockOrdersRepository.findMyVehicle.mockResolvedValue(mockVehicle);

      const result = await service.findMyVehicle(3);

      expect(result).toEqual(mockVehicle);
    });

    it('lanza NotFoundException si el usuario no tiene vehículo asignado', async () => {
      mockOrdersRepository.findMyVehicle.mockResolvedValue(null);

      await expect(service.findMyVehicle(3)).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // getDeliveredOrder (cliente)
  // ══════════════════════════════════════════════════════════════════

  describe('getDeliveredOrder', () => {
    it('delega al repositorio y retorna null si no hay pedido entregado', async () => {
      mockOrdersRepository.findDeliveredOrder.mockResolvedValue(null);

      const result = await service.getDeliveredOrder(3);

      expect(result).toBeNull();
    });

    it('retorna el pedido entregado con deliveredAt', async () => {
      const delivered = { orderId: 1, status: 'delivered', trackingCode: 'ELE-2026-00001', deliveredAt: '2026-04-01T00:00:00.000Z' };
      mockOrdersRepository.findDeliveredOrder.mockResolvedValue(delivered);

      const result = await service.getDeliveredOrder(3);

      expect(result).toEqual(delivered);
      expect(result?.deliveredAt).toBeDefined();
    });
  });
});
