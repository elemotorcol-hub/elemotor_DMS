import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

import { MaintenanceService } from './maintenance.service';
import { MaintenanceRepository } from './maintenance.repository';
import { OrdersRepository } from '../orders/orders.repository';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockMaintenanceRepository = {
  create: jest.fn(),
  findByUserAndOrder: jest.fn(),
  getSummary: jest.fn(),
  updateWorkshopRating: jest.fn(),
};

const mockOrdersRepository = {
  findByIdAndUserId: jest.fn(),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockDeliveredOrder = {
  id: 10,
  trackingCode: 'ELE-2026-00001',
  status: OrderStatus.delivered,
  userId: 3,
};

const mockMaintenanceRecord = {
  id: 1,
  userId: 3,
  orderId: 10,
  type: 'preventivo',
  description: 'Revisión general',
  cost: 150000,
  workshopId: null,
  rating: null,
  serviceDate: new Date(),
  createdAt: new Date(),
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('MaintenanceService', () => {
  let service: MaintenanceService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceService,
        { provide: MaintenanceRepository, useValue: mockMaintenanceRepository },
        { provide: OrdersRepository,      useValue: mockOrdersRepository },
      ],
    }).compile();

    service = module.get<MaintenanceService>(MaintenanceService);
  });

  // ══════════════════════════════════════════════════════════════════
  // createRecord
  // ══════════════════════════════════════════════════════════════════

  describe('createRecord', () => {
    const dto = { orderId: 10, type: 'preventivo' as any, description: 'Revisión', cost: 150000, date: '2026-05-01' };

    it('lanza NotFoundException si el pedido no existe o no pertenece al usuario', async () => {
      mockOrdersRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.createRecord(3, dto)).rejects.toThrow(NotFoundException);
    });

    it('el mensaje de NotFoundException incluye el orderId', async () => {
      mockOrdersRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.createRecord(3, { ...dto, orderId: 55 })).rejects.toThrow('55');
    });

    it('lanza ForbiddenException si el pedido no está en estado "delivered"', async () => {
      mockOrdersRepository.findByIdAndUserId.mockResolvedValue({
        ...mockDeliveredOrder,
        status: OrderStatus.confirmed,
      });

      await expect(service.createRecord(3, dto)).rejects.toThrow(ForbiddenException);
    });

    it('crea el registro si el pedido está entregado', async () => {
      mockOrdersRepository.findByIdAndUserId.mockResolvedValue(mockDeliveredOrder);
      mockMaintenanceRepository.create.mockResolvedValue(mockMaintenanceRecord);

      const result = await service.createRecord(3, dto);

      expect(mockMaintenanceRepository.create).toHaveBeenCalledWith(3, dto);
      expect(result).toEqual(mockMaintenanceRecord);
    });

    it('NO actualiza el rating del taller si no se provee workshopId', async () => {
      mockOrdersRepository.findByIdAndUserId.mockResolvedValue(mockDeliveredOrder);
      mockMaintenanceRepository.create.mockResolvedValue(mockMaintenanceRecord);

      await service.createRecord(3, dto); // sin workshopId

      expect(mockMaintenanceRepository.updateWorkshopRating).not.toHaveBeenCalled();
    });

    it('NO actualiza el rating del taller si se provee workshopId pero sin rating', async () => {
      mockOrdersRepository.findByIdAndUserId.mockResolvedValue(mockDeliveredOrder);
      mockMaintenanceRepository.create.mockResolvedValue(mockMaintenanceRecord);

      await service.createRecord(3, { ...dto, workshopId: 5 }); // sin rating

      expect(mockMaintenanceRepository.updateWorkshopRating).not.toHaveBeenCalled();
    });

    it('actualiza el rating del taller (fire-and-forget) si se provee workshopId y rating', async () => {
      mockOrdersRepository.findByIdAndUserId.mockResolvedValue(mockDeliveredOrder);
      mockMaintenanceRepository.create.mockResolvedValue({
        ...mockMaintenanceRecord,
        workshopId: 5,
        rating: 4,
      });
      mockMaintenanceRepository.updateWorkshopRating.mockResolvedValue(undefined);

      await service.createRecord(3, { ...dto, workshopId: 5, rating: 4 });

      // Pequeña espera para que la promesa fire-and-forget se resuelva
      await new Promise(resolve => setImmediate(resolve));

      expect(mockMaintenanceRepository.updateWorkshopRating).toHaveBeenCalledWith(5);
    });

    it('no bloquea la respuesta si updateWorkshopRating falla', async () => {
      mockOrdersRepository.findByIdAndUserId.mockResolvedValue(mockDeliveredOrder);
      mockMaintenanceRepository.create.mockResolvedValue({
        ...mockMaintenanceRecord,
        workshopId: 5,
        rating: 3,
      });
      mockMaintenanceRepository.updateWorkshopRating.mockRejectedValue(new Error('DB error'));

      // No debe lanzar error aunque el fire-and-forget falle
      await expect(
        service.createRecord(3, { ...dto, workshopId: 5, rating: 3 }),
      ).resolves.toBeDefined();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // findRecords
  // ══════════════════════════════════════════════════════════════════

  describe('findRecords', () => {
    it('retorna historial paginado con meta correcta', async () => {
      mockMaintenanceRepository.findByUserAndOrder.mockResolvedValue({
        data: [mockMaintenanceRecord],
        total: 1,
      });

      const result = await service.findRecords(3, { orderId: 10, page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('usa page=1 y limit=20 por defecto', async () => {
      mockMaintenanceRepository.findByUserAndOrder.mockResolvedValue({ data: [], total: 0 });

      const result = await service.findRecords(3, { orderId: 10 });

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('calcula totalPages correctamente', async () => {
      mockMaintenanceRepository.findByUserAndOrder.mockResolvedValue({ data: [], total: 45 });

      const result = await service.findRecords(3, { orderId: 10, page: 1, limit: 20 });

      expect(result.meta.totalPages).toBe(3);
    });

    it('pasa el orderId al repositorio', async () => {
      mockMaintenanceRepository.findByUserAndOrder.mockResolvedValue({ data: [], total: 0 });

      await service.findRecords(3, { orderId: 10 });

      expect(mockMaintenanceRepository.findByUserAndOrder).toHaveBeenCalledWith(3, 10, 1, 20);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // getSummary
  // ══════════════════════════════════════════════════════════════════

  describe('getSummary', () => {
    it('delega al repositorio con userId y orderId', async () => {
      const mockSummary = { totalSpent: 300000, totalRecords: 2 };
      mockMaintenanceRepository.getSummary.mockResolvedValue(mockSummary);

      const result = await service.getSummary(3, 10);

      expect(mockMaintenanceRepository.getSummary).toHaveBeenCalledWith(3, 10);
      expect(result).toEqual(mockSummary);
    });
  });
});
