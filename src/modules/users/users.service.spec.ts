import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

// bcrypt non-writable — mock a nivel de módulo
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$newhashedpassword'),
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UploadService } from '../upload/upload.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUsersRepository = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
  updatePassword: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  countSuperAdmins: jest.fn(),
  updateRole: jest.fn(),
  createEmployee: jest.fn(),
};

const mockUploadService = {
  deleteFile: jest.fn(),
};

// ─── Fixture ──────────────────────────────────────────────────────────────────

const mockUser = {
  id: 1,
  name: 'Juan Pérez',
  email: 'juan@elemotor.co',
  phone: '+573001234567',
  cedula: '123456789',
  city: 'Bucaramanga',
  avatarUrl: null,
  avatarPublicId: null,
  role: UserRole.client,
  passwordHash: '$2b$12$existinghash',
  refreshToken: null,
  emailVerifiedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository,  useValue: mockUsersRepository },
        { provide: UploadService,    useValue: mockUploadService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  // ══════════════════════════════════════════════════════════════════
  // getProfile
  // ══════════════════════════════════════════════════════════════════

  describe('getProfile', () => {
    it('lanza NotFoundException si el usuario no existe', async () => {
      mockUsersRepository.findById.mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
    });

    it('retorna solo los campos del perfil sin datos sensibles', async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getProfile(1);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('refreshToken');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // updateProfile
  // ══════════════════════════════════════════════════════════════════

  describe('updateProfile', () => {
    it('retorna el perfil sin hacer UPDATE si el payload está vacío', async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);

      await service.updateProfile(1, {});

      expect(mockUsersRepository.update).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si el usuario no existe', async () => {
      mockUsersRepository.findById.mockResolvedValue(null);

      await expect(service.updateProfile(999, { name: 'Nuevo' })).rejects.toThrow(NotFoundException);
    });

    it('elimina el avatar anterior de Cloudinary cuando cambia el avatarPublicId', async () => {
      const userWithAvatar = { ...mockUser, avatarPublicId: 'old-public-id' };
      mockUsersRepository.findById.mockResolvedValue(userWithAvatar);
      mockUsersRepository.update.mockResolvedValue({ ...userWithAvatar, avatarPublicId: 'new-id' });

      await service.updateProfile(1, { avatarPublicId: 'new-id', avatarUrl: 'https://new.url' });

      expect(mockUploadService.deleteFile).toHaveBeenCalledWith('old-public-id', 'image');
    });

    it('NO elimina avatar si el avatarPublicId no cambia', async () => {
      const userWithAvatar = { ...mockUser, avatarPublicId: 'same-id' };
      mockUsersRepository.findById.mockResolvedValue(userWithAvatar);
      mockUsersRepository.update.mockResolvedValue(userWithAvatar);

      await service.updateProfile(1, { avatarPublicId: 'same-id' });

      expect(mockUploadService.deleteFile).not.toHaveBeenCalled();
    });

    it('NO elimina avatar si el usuario no tenía avatarPublicId previo', async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser); // avatarPublicId: null
      mockUsersRepository.update.mockResolvedValue({ ...mockUser, avatarPublicId: 'new-id' });

      await service.updateProfile(1, { avatarPublicId: 'new-id' });

      expect(mockUploadService.deleteFile).not.toHaveBeenCalled();
    });

    it('retorna solo campos del perfil tras la actualización', async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      mockUsersRepository.update.mockResolvedValue({ ...mockUser, name: 'Actualizado' });

      const result = await service.updateProfile(1, { name: 'Actualizado' });

      expect(result).toHaveProperty('name', 'Actualizado');
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // changePassword
  // ══════════════════════════════════════════════════════════════════

  describe('changePassword', () => {
    it('lanza NotFoundException si el usuario no existe', async () => {
      mockUsersRepository.findById.mockResolvedValue(null);

      await expect(
        service.changePassword(999, { currentPassword: 'old', newPassword: 'New1!' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException si el usuario es OAuth (sin passwordHash)', async () => {
      mockUsersRepository.findById.mockResolvedValue({ ...mockUser, passwordHash: null });

      await expect(
        service.changePassword(1, { currentPassword: 'old', newPassword: 'New1!' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza UnauthorizedException si la contraseña actual es incorrecta', async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(1, { currentPassword: 'wrong', newPassword: 'New1!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('hashea la nueva contraseña y la actualiza en BD', async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.changePassword(1, { currentPassword: 'correct', newPassword: 'NewPass1!' });

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass1!', 12);
      expect(mockUsersRepository.updatePassword).toHaveBeenCalledWith(1, '$2b$12$newhashedpassword');
    });

    it('retorna mensaje de éxito', async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.changePassword(1, { currentPassword: 'ok', newPassword: 'New1!' });

      expect(result.message).toContain('Contraseña actualizada');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // createEmployee (admin)
  // ══════════════════════════════════════════════════════════════════

  describe('createEmployee', () => {
    const dto = { name: 'Admin User', email: 'admin@elemotor.co', password: 'Admin1!', phone: '+573001111111', role: UserRole.admin };

    it('lanza BadRequestException si el email ya existe', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.createEmployee(dto)).rejects.toThrow(BadRequestException);
    });

    it('hashea la contraseña antes de guardar', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(null);
      mockUsersRepository.createEmployee.mockResolvedValue({ ...mockUser, role: UserRole.admin });

      await service.createEmployee(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('Admin1!', 12);
    });

    it('asigna role=admin por defecto si no se especifica', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(null);
      mockUsersRepository.createEmployee.mockResolvedValue({ ...mockUser, role: UserRole.admin });

      await service.createEmployee({ name: 'A', email: 'a@test.com', password: 'P1!', phone: '+57300' });

      expect(mockUsersRepository.createEmployee).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.admin }),
      );
    });

    it('retorna solo los campos básicos del empleado creado', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(null);
      mockUsersRepository.createEmployee.mockResolvedValue({ ...mockUser, role: UserRole.admin });

      const result = await service.createEmployee(dto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // findAll (admin)
  // ══════════════════════════════════════════════════════════════════

  describe('findAll', () => {
    it('retorna usuarios paginados con meta correcta', async () => {
      mockUsersRepository.findMany.mockResolvedValue([mockUser]);
      mockUsersRepository.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('usa page=1 y limit=10 por defecto', async () => {
      mockUsersRepository.findMany.mockResolvedValue([]);
      mockUsersRepository.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // changeRole (super_admin)
  // ══════════════════════════════════════════════════════════════════

  describe('changeRole', () => {
    it('lanza NotFoundException si el usuario objetivo no existe', async () => {
      mockUsersRepository.findById.mockResolvedValue(null);

      await expect(
        service.changeRole(999, { role: UserRole.admin }, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException si el admin intenta cambiarse su propio rol', async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser);

      await expect(
        service.changeRole(1, { role: UserRole.admin }, 1), // targetId === currentUserId
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si intenta quitar el rol al único super_admin', async () => {
      const superAdmin = { ...mockUser, id: 2, role: UserRole.super_admin };
      mockUsersRepository.findById.mockResolvedValue(superAdmin);
      mockUsersRepository.countSuperAdmins.mockResolvedValue(1);

      await expect(
        service.changeRole(2, { role: UserRole.admin }, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('permite quitar super_admin si hay más de uno', async () => {
      const superAdmin = { ...mockUser, id: 2, role: UserRole.super_admin };
      mockUsersRepository.findById.mockResolvedValue(superAdmin);
      mockUsersRepository.countSuperAdmins.mockResolvedValue(2);
      mockUsersRepository.updateRole.mockResolvedValue({ ...superAdmin, role: UserRole.admin });

      const result = await service.changeRole(2, { role: UserRole.admin }, 1);

      expect(result.role).toBe(UserRole.admin);
    });

    it('cambia el rol exitosamente y retorna los datos básicos', async () => {
      mockUsersRepository.findById.mockResolvedValue(mockUser); // role: client
      mockUsersRepository.updateRole.mockResolvedValue({ ...mockUser, role: UserRole.admin });

      const result = await service.changeRole(1, { role: UserRole.admin }, 99);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('role', UserRole.admin);
      expect(result).not.toHaveProperty('passwordHash');
    });
  });
});
