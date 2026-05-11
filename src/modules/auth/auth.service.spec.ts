import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

// bcrypt debe mockearse a nivel de módulo — sus propiedades son non-writable
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashed'),
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { QuotesRepository } from '../quotes/quotes.repository';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAuthRepository = {
  findByEmail: jest.fn(),
  findByGoogleId: jest.fn(),
  findById: jest.fn(),
  findByPhone: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateRefreshToken: jest.fn(),
  saveOtp: jest.fn(),
  clearOtp: jest.fn(),
  savePasswordResetToken: jest.fn(),
  findByResetToken: jest.fn(),
  updatePassword: jest.fn(),
};

const mockQuotesRepository = {
  claimAnonymousByEmail: jest.fn().mockResolvedValue(0),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const map: Record<string, any> = {
      'jwt.secret': 'test-secret',
      'jwt.expiresIn': '15m',
      'jwt.refreshSecret': 'test-refresh-secret',
      'jwt.refreshExpiresIn': '7d',
      'otp.expiresMinutes': 5,
      'otp.provider': 'mock',
      'app.nodeEnv': 'test',
      'app.frontendUrl': 'http://localhost:3001',
      'mail.host': 'smtp.test.com',
      'mail.port': 587,
      'mail.user': 'test@test.com',
      'mail.pass': 'test-pass',
      'mail.from': 'noreply@test.com',
      'google.clientId': 'mock-google-client-id',
    };
    return map[key];
  }),
};

// ─── Fixture de usuario ────────────────────────────────────────────────────────

const mockUser = {
  id: 1,
  name: 'Juan Pérez',
  email: 'juan@elemotor.co',
  phone: '+573001234567',
  role: 'client',
  passwordHash: '$2b$12$hashedpassword',
  refreshToken: null,
  googleId: null,
  avatarUrl: null,
  otpCode: null,
  otpExpiresAt: null,
  emailVerifiedAt: null,
  passwordResetToken: null,
  passwordResetExpires: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository,    useValue: mockAuthRepository },
        { provide: QuotesRepository,  useValue: mockQuotesRepository },
        { provide: JwtService,        useValue: mockJwtService },
        { provide: ConfigService,     useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Mock updateRefreshToken por defecto (se llama en buildAuthResponse)
    mockAuthRepository.updateRefreshToken.mockResolvedValue(undefined);
  });

  // ══════════════════════════════════════════════════════════════════
  // register
  // ══════════════════════════════════════════════════════════════════

  describe('register', () => {
    it('lanza ConflictException si el email ya existe', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({ name: 'Test', email: 'juan@elemotor.co', password: 'Password1!' }),
      ).rejects.toThrow(ConflictException);
    });

    it('crea el usuario y retorna tokens si el email no existe', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockAuthRepository.create.mockResolvedValue(mockUser);

      const result = await service.register({
        name: 'Juan Pérez',
        email: 'nuevo@elemotor.co',
        password: 'Password1!',
      });

      expect(mockAuthRepository.create).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('hashea la contraseña antes de guardar', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockAuthRepository.create.mockResolvedValue(mockUser);

      await service.register({ name: 'A', email: 'a@test.com', password: 'Pass1!' });

      expect(bcrypt.hash).toHaveBeenCalledWith('Pass1!', 12);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // login
  // ══════════════════════════════════════════════════════════════════

  describe('login', () => {
    it('lanza UnauthorizedException si el usuario no existe', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexiste@test.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el usuario no tiene passwordHash', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue({ ...mockUser, passwordHash: null });

      await expect(
        service.login({ email: 'juan@elemotor.co', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si la contraseña es incorrecta', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'juan@elemotor.co', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('retorna tokens si las credenciales son válidas', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'juan@elemotor.co', password: 'correct' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.id).toBe(1);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // googleAuth
  // ══════════════════════════════════════════════════════════════════

  describe('googleAuth', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('lanza UnauthorizedException si el fetch a Google falla', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      await expect(
        service.googleAuth({ accessToken: 'bad-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el payload no tiene email', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: '123' }), // sin email
      });

      await expect(
        service.googleAuth({ accessToken: 'token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('crea un nuevo usuario si no existe por Google ID ni email', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'g123', email: 'nuevo@google.com', name: 'Google User', picture: 'url' }),
      });
      mockAuthRepository.findByGoogleId.mockResolvedValue(null);
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockAuthRepository.create.mockResolvedValue({ ...mockUser, googleId: 'g123', email: 'nuevo@google.com' });

      const result = await service.googleAuth({ accessToken: 'valid-token' });

      expect(mockAuthRepository.create).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('accessToken');
    });

    it('actualiza un usuario existente encontrado por googleId', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'g123', email: 'juan@elemotor.co', name: 'Juan', picture: 'url' }),
      });
      mockAuthRepository.findByGoogleId.mockResolvedValue(mockUser);
      mockAuthRepository.update.mockResolvedValue(mockUser);

      const result = await service.googleAuth({ accessToken: 'valid-token' });

      expect(mockAuthRepository.update).toHaveBeenCalledTimes(1);
      expect(mockAuthRepository.create).not.toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
    });

    it('busca por email si no encuentra por googleId', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'g123', email: 'juan@elemotor.co', name: 'Juan', picture: null }),
      });
      mockAuthRepository.findByGoogleId.mockResolvedValue(null);
      mockAuthRepository.findByEmail.mockResolvedValue(mockUser);
      mockAuthRepository.update.mockResolvedValue(mockUser);

      await service.googleAuth({ accessToken: 'valid-token' });

      expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith('juan@elemotor.co');
      expect(mockAuthRepository.update).toHaveBeenCalledTimes(1);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // refreshToken
  // ══════════════════════════════════════════════════════════════════

  describe('refreshToken', () => {
    it('lanza UnauthorizedException si el token JWT es inválido', async () => {
      mockJwtService.verify.mockImplementation(() => { throw new Error('invalid'); });

      await expect(
        service.refreshToken({ refreshToken: 'invalid.token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el usuario no existe en BD', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 1, email: 'a@test.com', role: 'client' });
      mockAuthRepository.findById.mockResolvedValue(null);

      await expect(
        service.refreshToken({ refreshToken: 'valid.token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el hash no coincide', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 1, email: 'a@test.com', role: 'client' });
      mockAuthRepository.findById.mockResolvedValue({ ...mockUser, refreshToken: 'diferente-hash' });

      await expect(
        service.refreshToken({ refreshToken: 'my.token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('retorna nuevo accessToken si el refresh token es válido', async () => {
      const token = 'my.refresh.token';
      const hash = crypto.createHash('sha256').update(token).digest('hex');

      mockJwtService.verify.mockReturnValue({ sub: 1, email: 'a@test.com', role: 'client' });
      mockAuthRepository.findById.mockResolvedValue({ ...mockUser, refreshToken: hash });

      const result = await service.refreshToken({ refreshToken: token });

      expect(result).toHaveProperty('accessToken');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // logout
  // ══════════════════════════════════════════════════════════════════

  describe('logout', () => {
    it('limpia el refreshToken del usuario y retorna mensaje', async () => {
      await service.logout(1);

      expect(mockAuthRepository.updateRefreshToken).toHaveBeenCalledWith(1, null);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // verifyOtp
  // ══════════════════════════════════════════════════════════════════

  describe('verifyOtp', () => {
    it('lanza UnauthorizedException si el usuario no existe', async () => {
      mockAuthRepository.findByPhone.mockResolvedValue(null);

      await expect(
        service.verifyOtp({ phone: '+57300', code: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el OTP no coincide', async () => {
      mockAuthRepository.findByPhone.mockResolvedValue({
        ...mockUser,
        otpCode: '111111',
        otpExpiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        service.verifyOtp({ phone: '+57300', code: '999999' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el OTP expiró', async () => {
      mockAuthRepository.findByPhone.mockResolvedValue({
        ...mockUser,
        otpCode: '123456',
        otpExpiresAt: new Date(Date.now() - 1000), // en el pasado
      });

      await expect(
        service.verifyOtp({ phone: '+57300', code: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('retorna tokens y limpia OTP si el código es válido', async () => {
      mockAuthRepository.findByPhone.mockResolvedValue({
        ...mockUser,
        otpCode: '123456',
        otpExpiresAt: new Date(Date.now() + 60_000),
      });
      mockAuthRepository.clearOtp.mockResolvedValue(undefined);

      const result = await service.verifyOtp({ phone: '+57300', code: '123456' });

      expect(mockAuthRepository.clearOtp).toHaveBeenCalledWith(mockUser.id);
      expect(result).toHaveProperty('accessToken');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // resetPassword
  // ══════════════════════════════════════════════════════════════════

  describe('resetPassword', () => {
    it('lanza BadRequestException si el token no existe en BD', async () => {
      mockAuthRepository.findByResetToken.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'invalid-token', newPassword: 'NewPass1!' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si el token expiró', async () => {
      mockAuthRepository.findByResetToken.mockResolvedValue({
        ...mockUser,
        passwordResetExpires: new Date(Date.now() - 1000),
      });

      await expect(
        service.resetPassword({ token: 'expired-token', newPassword: 'NewPass1!' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('actualiza la contraseña e invalida el refreshToken si el token es válido', async () => {
      mockAuthRepository.findByResetToken.mockResolvedValue({
        ...mockUser,
        passwordResetExpires: new Date(Date.now() + 3_600_000),
      });
      mockAuthRepository.updatePassword.mockResolvedValue(undefined);

      const result = await service.resetPassword({ token: 'valid-token', newPassword: 'NewPass1!' });

      expect(mockAuthRepository.updatePassword).toHaveBeenCalledTimes(1);
      expect(mockAuthRepository.updateRefreshToken).toHaveBeenCalledWith(mockUser.id, null);
      expect(result.message).toContain('Contraseña actualizada');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // forgotPassword
  // ══════════════════════════════════════════════════════════════════

  describe('forgotPassword', () => {
    it('retorna respuesta genérica si el email no existe (sin revelar existencia)', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'noexiste@test.com' });

      expect(result.message).toContain('Si el email está registrado');
      expect(mockAuthRepository.savePasswordResetToken).not.toHaveBeenCalled();
    });

    it('guarda el token de reset si el email existe', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(mockUser);
      mockAuthRepository.savePasswordResetToken.mockResolvedValue(undefined);

      const result = await service.forgotPassword({ email: 'juan@elemotor.co' });

      expect(mockAuthRepository.savePasswordResetToken).toHaveBeenCalledTimes(1);
      expect(result.message).toContain('Si el email está registrado');
    });
  });
});
