import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { ColorsService } from './colors.service';
import { ColorsRepository } from './colors.repository';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockColorsRepository = {
  create: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  findById: jest.fn(),
  findByTrim: jest.fn(),
  checkExists: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findTrimById: jest.fn(),
};

// ─── Fixture ──────────────────────────────────────────────────────────────────

const mockColor = {
  id: 1,
  name: 'Blanco Perla',
  hexCode: 'FFFFFF',
  trimId: 2,
  createdAt: new Date(),
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('ColorsService', () => {
  let service: ColorsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ColorsService,
        { provide: ColorsRepository, useValue: mockColorsRepository },
      ],
    }).compile();

    service = module.get<ColorsService>(ColorsService);
  });

  // ══════════════════════════════════════════════════════════════════
  // create
  // ══════════════════════════════════════════════════════════════════

  describe('create', () => {
    const dto = { name: 'Blanco Perla', hexCode: 'FFFFFF', trimId: 2, type: 'solid' as any };

    it('lanza BadRequestException si el trim no existe', async () => {
      mockColorsRepository.findTrimById.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('normaliza el hexCode quitando el # y convirtiendo a mayúsculas', async () => {
      mockColorsRepository.findTrimById.mockResolvedValue({ id: 2 });
      mockColorsRepository.create.mockResolvedValue({ ...mockColor, hexCode: 'FF0000' });

      await service.create({ ...dto, hexCode: '#ff0000' });

      expect(mockColorsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ hexCode: 'FF0000' }),
      );
    });

    it('deja el hexCode sin cambios si no tiene #', async () => {
      mockColorsRepository.findTrimById.mockResolvedValue({ id: 2 });
      mockColorsRepository.create.mockResolvedValue(mockColor);

      await service.create(dto);

      expect(mockColorsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ hexCode: 'FFFFFF' }),
      );
    });

    it('lanza ConflictException si el color ya existe para ese trim (P2002)', async () => {
      mockColorsRepository.findTrimById.mockResolvedValue({ id: 2 });
      const p2002 = Object.assign(
        new Prisma.PrismaClientKnownRequestError('Unique constraint', {
          code: 'P2002',
          clientVersion: '6.0.0',
        }),
      );
      mockColorsRepository.create.mockRejectedValue(p2002);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('lanza BadRequestException si falla la FK (P2003)', async () => {
      mockColorsRepository.findTrimById.mockResolvedValue({ id: 2 });
      const p2003 = new Prisma.PrismaClientKnownRequestError('FK failed', {
        code: 'P2003',
        clientVersion: '6.0.0',
      });
      mockColorsRepository.create.mockRejectedValue(p2003);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('relanza errores no reconocidos', async () => {
      mockColorsRepository.findTrimById.mockResolvedValue({ id: 2 });
      mockColorsRepository.create.mockRejectedValue(new Error('unexpected'));

      await expect(service.create(dto)).rejects.toThrow('unexpected');
    });

    it('retorna el color creado en caso exitoso', async () => {
      mockColorsRepository.findTrimById.mockResolvedValue({ id: 2 });
      mockColorsRepository.create.mockResolvedValue(mockColor);

      const result = await service.create(dto);

      expect(result).toEqual(mockColor);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // findAll
  // ══════════════════════════════════════════════════════════════════

  describe('findAll', () => {
    it('retorna datos paginados con meta correcta', async () => {
      mockColorsRepository.findMany.mockResolvedValue([mockColor]);
      mockColorsRepository.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('usa page=1 y limit=10 por defecto', async () => {
      mockColorsRepository.findMany.mockResolvedValue([]);
      mockColorsRepository.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('calcula totalPages correctamente con múltiples páginas', async () => {
      mockColorsRepository.findMany.mockResolvedValue([]);
      mockColorsRepository.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(3);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // findOne
  // ══════════════════════════════════════════════════════════════════

  describe('findOne', () => {
    it('retorna el color si existe', async () => {
      mockColorsRepository.findById.mockResolvedValue(mockColor);

      const result = await service.findOne(1);

      expect(result).toEqual(mockColor);
    });

    it('lanza NotFoundException si el color no existe', async () => {
      mockColorsRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('el mensaje de NotFoundException incluye el id', async () => {
      mockColorsRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(42)).rejects.toThrow('42');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // findByTrim
  // ══════════════════════════════════════════════════════════════════

  describe('findByTrim', () => {
    it('delega al repositorio y retorna los colores del trim', async () => {
      mockColorsRepository.findByTrim.mockResolvedValue([mockColor]);

      const result = await service.findByTrim(2);

      expect(mockColorsRepository.findByTrim).toHaveBeenCalledWith(2);
      expect(result).toHaveLength(1);
    });

    it('retorna array vacío si el trim no tiene colores', async () => {
      mockColorsRepository.findByTrim.mockResolvedValue([]);

      const result = await service.findByTrim(99);

      expect(result).toHaveLength(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // update
  // ══════════════════════════════════════════════════════════════════

  describe('update', () => {
    it('lanza NotFoundException si el color no existe', async () => {
      mockColorsRepository.checkExists.mockResolvedValue(null);

      await expect(service.update(999, { name: 'Rojo' })).rejects.toThrow(NotFoundException);
    });

    it('normaliza el hexCode si se provee con #', async () => {
      mockColorsRepository.checkExists.mockResolvedValue(mockColor);
      mockColorsRepository.update.mockResolvedValue({ ...mockColor, hexCode: 'FF0000' });

      await service.update(1, { hexCode: '#ff0000' });

      expect(mockColorsRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ hexCode: 'FF0000' }),
      );
    });

    it('no modifica el hexCode si no se provee', async () => {
      mockColorsRepository.checkExists.mockResolvedValue(mockColor);
      mockColorsRepository.update.mockResolvedValue({ ...mockColor, name: 'Nuevo nombre' });

      await service.update(1, { name: 'Nuevo nombre' });

      const callArg = mockColorsRepository.update.mock.calls[0][1];
      expect(callArg).not.toHaveProperty('hexCode');
    });

    it('retorna el color actualizado en caso exitoso', async () => {
      mockColorsRepository.checkExists.mockResolvedValue(mockColor);
      mockColorsRepository.update.mockResolvedValue({ ...mockColor, name: 'Negro Metálico' });

      const result = await service.update(1, { name: 'Negro Metálico' });

      expect(result.name).toBe('Negro Metálico');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // remove
  // ══════════════════════════════════════════════════════════════════

  describe('remove', () => {
    it('lanza NotFoundException si el color no existe', async () => {
      mockColorsRepository.checkExists.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('llama al repositorio remove con el id correcto', async () => {
      mockColorsRepository.checkExists.mockResolvedValue(mockColor);
      mockColorsRepository.remove.mockResolvedValue(undefined);

      await service.remove(1);

      expect(mockColorsRepository.remove).toHaveBeenCalledWith(1);
    });
  });
});
