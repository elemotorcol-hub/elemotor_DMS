import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { QuotesService } from './quotes.service';
import { QuotesRepository } from './quotes.repository';
import { QuotesWebhookService } from './webhook/quotes-webhook.service';
import { UsersRepository } from '../users/users.repository';
import { OrdersRepository } from '../orders/orders.repository';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockQuotesRepository = {
  generateReferenceCode: jest.fn(),
  create: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  findByIdAdmin: jest.fn(),
  checkExistence: jest.fn(),
  update: jest.fn(),
  findByUserId: jest.fn(),
  getStats: jest.fn(),
};

const mockWebhookService = {
  fire: jest.fn(),
};

const mockUsersRepository = {
  findByEmail: jest.fn(),
  createClient: jest.fn(),
};

const mockOrdersRepository = {
  findByTrackingCodeOnly: jest.fn(),
  assignToUserId: jest.fn(),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockUser = {
  id: 5,
  name: 'Ana López',
  email: 'ana@test.com',
};

const mockQuote = {
  id: 1,
  referenceCode: 'COT-2026-00001',
  status: 'pending',
  name: 'Ana López',
  email: 'ana@test.com',
  phone: '+573001234567',
  preferredChannel: 'whatsapp',
  model: null,
  trim: null,
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  source: 'web',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createDto = {
  name: 'Ana López',
  email: 'ana@test.com',
  phone: '+573001234567',
  preferredChannel: 'whatsapp' as any,
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('QuotesService', () => {
  let service: QuotesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        { provide: QuotesRepository,       useValue: mockQuotesRepository },
        { provide: QuotesWebhookService,   useValue: mockWebhookService },
        { provide: UsersRepository,        useValue: mockUsersRepository },
        { provide: OrdersRepository,       useValue: mockOrdersRepository },
      ],
    }).compile();

    service = module.get<QuotesService>(QuotesService);
  });

  // ══════════════════════════════════════════════════════════════════
  // create
  // ══════════════════════════════════════════════════════════════════

  describe('create', () => {
    beforeEach(() => {
      mockQuotesRepository.generateReferenceCode.mockResolvedValue('COT-2026-00001');
      mockQuotesRepository.create.mockResolvedValue(mockQuote);
    });

    it('usa el userId del usuario existente si el email ya está registrado', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);

      await service.create(createDto);

      expect(mockUsersRepository.createClient).not.toHaveBeenCalled();
      expect(mockQuotesRepository.create).toHaveBeenCalledWith(
        createDto,
        'COT-2026-00001',
        mockUser.id,
      );
    });

    it('crea un nuevo usuario cliente si el email no está registrado', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(null);
      mockUsersRepository.createClient.mockResolvedValue({ ...mockUser, id: 99 });

      await service.create(createDto);

      expect(mockUsersRepository.createClient).toHaveBeenCalledTimes(1);
      expect(mockQuotesRepository.create).toHaveBeenCalledWith(
        createDto,
        'COT-2026-00001',
        99,
      );
    });

    it('asigna el pedido al usuario si se provee trackingCode y el pedido no tiene userId', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);
      mockOrdersRepository.findByTrackingCodeOnly.mockResolvedValue({ id: 10, userId: null });

      await service.create({ ...createDto, trackingCode: 'ELE-2026-00001' });

      expect(mockOrdersRepository.assignToUserId).toHaveBeenCalledWith(10, mockUser.id);
    });

    it('NO asigna el pedido si ya tiene un userId asignado', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);
      mockOrdersRepository.findByTrackingCodeOnly.mockResolvedValue({ id: 10, userId: 3 });

      await service.create({ ...createDto, trackingCode: 'ELE-2026-00001' });

      expect(mockOrdersRepository.assignToUserId).not.toHaveBeenCalled();
    });

    it('NO intenta vincular pedido si no se provee trackingCode', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);

      await service.create(createDto);

      expect(mockOrdersRepository.findByTrackingCodeOnly).not.toHaveBeenCalled();
    });

    it('dispara el webhook después de crear (fire-and-forget)', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);

      await service.create(createDto);

      expect(mockWebhookService.fire).toHaveBeenCalledTimes(1);
    });

    it('genera el referenceCode con el año actual', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);

      await service.create(createDto);

      expect(mockQuotesRepository.generateReferenceCode).toHaveBeenCalledWith(
        new Date().getFullYear(),
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // findAll (admin)
  // ══════════════════════════════════════════════════════════════════

  describe('findAll', () => {
    it('retorna resultados paginados con meta correcta', async () => {
      mockQuotesRepository.findMany.mockResolvedValue([mockQuote, mockQuote]);
      mockQuotesRepository.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.totalPages).toBe(1);
    });

    it('calcula totalPages correctamente', async () => {
      mockQuotesRepository.findMany.mockResolvedValue([]);
      mockQuotesRepository.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(3);
    });

    it('usa valores por defecto page=1 y limit=10', async () => {
      mockQuotesRepository.findMany.mockResolvedValue([]);
      mockQuotesRepository.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // findOne (admin)
  // ══════════════════════════════════════════════════════════════════

  describe('findOne', () => {
    it('retorna la cotización si existe', async () => {
      mockQuotesRepository.findByIdAdmin.mockResolvedValue(mockQuote);

      const result = await service.findOne(1);

      expect(result).toEqual(mockQuote);
    });

    it('lanza NotFoundException si la cotización no existe', async () => {
      mockQuotesRepository.findByIdAdmin.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('el mensaje de NotFoundException incluye el id', async () => {
      mockQuotesRepository.findByIdAdmin.mockResolvedValue(null);

      await expect(service.findOne(42)).rejects.toThrow('42');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // update (admin)
  // ══════════════════════════════════════════════════════════════════

  describe('update', () => {
    it('actualiza la cotización si existe', async () => {
      mockQuotesRepository.checkExistence.mockResolvedValue(true);
      mockQuotesRepository.update.mockResolvedValue({ ...mockQuote, status: 'contacted' });

      const result = await service.update(1, { status: 'contacted' as any });

      expect(result.status).toBe('contacted');
    });

    it('lanza NotFoundException si la cotización no existe', async () => {
      mockQuotesRepository.checkExistence.mockResolvedValue(null);

      await expect(service.update(999, { status: 'contacted' as any })).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // findMyQuotes (cliente)
  // ══════════════════════════════════════════════════════════════════

  describe('findMyQuotes', () => {
    it('retorna cotizaciones paginadas del usuario', async () => {
      mockQuotesRepository.findByUserId.mockResolvedValue({ data: [mockQuote], total: 1 });

      const result = await service.findMyQuotes(5, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('retorna lista vacía si el usuario no tiene cotizaciones', async () => {
      mockQuotesRepository.findByUserId.mockResolvedValue({ data: [], total: 0 });

      const result = await service.findMyQuotes(5, {});

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // getStats (admin)
  // ══════════════════════════════════════════════════════════════════

  describe('getStats', () => {
    it('delega al repositorio y retorna las estadísticas', async () => {
      const mockStats = { total: 100, totalToday: 5, byStatus: [], bySource: [] };
      mockQuotesRepository.getStats.mockResolvedValue(mockStats);

      const result = await service.getStats();

      expect(result).toEqual(mockStats);
      expect(mockQuotesRepository.getStats).toHaveBeenCalledTimes(1);
    });
  });
});
