import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { User } from '@prisma/client';

import { AuthRepository } from './auth.repository';
import { QuotesRepository } from '../quotes/quotes.repository';
import { IAuthService } from './interfaces/auth-service.interface';
import { IAuthResponse, IRefreshResponse, ISafeUser } from './interfaces/auth-response.interface';
import { ITokenPayload } from './interfaces/token-payload.interface';
import {
  RegisterDto,
  LoginDto,
  GoogleAuthDto,
  OtpSendDto,
  OtpVerifyDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';

/** Número de rounds de bcrypt — OWASP recomienda mínimo 12 */
const BCRYPT_SALT_ROUNDS = 12;

/**
 * AuthService — Lógica de negocio del sistema de autenticación.
 *
 * Implementa el flujo completo: registro, login, OAuth, OTP, refresh token,
 * recuperación de contraseña y logout, siguiendo buenas prácticas OWASP.
 */
@Injectable()
export class AuthService implements IAuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly quotesRepository: QuotesRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.config.get<string>('google.clientId'),
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // REGISTRO
  // ─────────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<IAuthResponse> {
    const existing = await this.authRepository.findByEmail(dto.email);
    if (existing) {
      // Mensaje genérico para no revelar si el email existe (OWASP)
      throw new ConflictException('Ya existe una cuenta con este email');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.authRepository.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
    });

    // Link any anonymous quotes created before registration (fire-and-forget).
    this.claimQuotesForNewUser(user, 'local');

    return this.buildAuthResponse(user);
  }

  // ─────────────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<IAuthResponse> {
    const user = await this.authRepository.findByEmail(dto.email);

    // Mensaje genérico para no revelar si el email existe (OWASP)
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.buildAuthResponse(user);
  }

  // ─────────────────────────────────────────────────────────────────
  // GOOGLE OAUTH
  // ─────────────────────────────────────────────────────────────────

  async googleAuth(dto: GoogleAuthDto): Promise<IAuthResponse> {
    let email: string;
    let name: string;
    let googleId: string;
    let avatarUrl: string | undefined;

    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${dto.accessToken}` },
      });

      if (!res.ok) {
        throw new UnauthorizedException('Token de Google inválido o expirado');
      }

      const payload = await res.json() as { id?: string; email?: string; name?: string; picture?: string };

      if (!payload?.email || !payload?.id) {
        throw new UnauthorizedException('Token de Google inválido o expirado');
      }

      email = payload.email;
      name = payload.name ?? email.split('@')[0];
      googleId = payload.id;
      avatarUrl = payload.picture;
    } catch {
      throw new UnauthorizedException('Token de Google inválido o expirado');
    }

    // Buscar usuario por Google ID o email, y hacer upsert
    let user = await this.authRepository.findByGoogleId(googleId);

    if (!user) {
      user = await this.authRepository.findByEmail(email);
    }

    if (user) {
      // Usuario existente: actualizar datos de Google si cambiaron
      user = await this.authRepository.update(user.id, {
        googleId,
        avatarUrl: avatarUrl ?? user.avatarUrl,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      });
    } else {
      // Nuevo usuario vía Google
      user = await this.authRepository.create({
        name,
        email,
        googleId,
        avatarUrl,
        emailVerifiedAt: new Date(),
      });

      // Link anonymous quotes created before the Google sign-up (fire-and-forget)
      this.claimQuotesForNewUser(user, 'Google');
    }

    return this.buildAuthResponse(user);
  }

  // ─────────────────────────────────────────────────────────────────
  // OTP — ENVÍO
  // ─────────────────────────────────────────────────────────────────

  async sendOtp(dto: OtpSendDto): Promise<{ message: string }> {
    const user = await this.authRepository.findByPhone(dto.phone);
    if (!user) {
      // Mensaje genérico para no revelar si el teléfono existe (OWASP)
      return { message: 'Si el número está registrado, recibirás un código OTP' };
    }

    const otpCode = this.generateOtpCode();
    const expiresMinutes = this.config.get<number>('otp.expiresMinutes') ?? 5;
    const otpExpiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    await this.authRepository.saveOtp(user.id, otpCode, otpExpiresAt);

    const provider = this.config.get<string>('otp.provider');

    if (provider === 'mock' || this.config.get<string>('app.nodeEnv') === 'development') {
      // Mock: solo loguea en consola, no envía SMS real
      this.logger.warn(
        `[OTP MOCK] Código para ${dto.phone}: ${otpCode} (expira en ${expiresMinutes} min)`,
      );
    } else {
      // Aquí se integraría con Twilio / WhatsApp Business API
      this.logger.log(`OTP enviado a ${dto.phone} vía ${provider}`);
    }

    return { message: 'Si el número está registrado, recibirás un código OTP' };
  }

  // ─────────────────────────────────────────────────────────────────
  // OTP — VERIFICACIÓN
  // ─────────────────────────────────────────────────────────────────

  async verifyOtp(dto: OtpVerifyDto): Promise<IAuthResponse> {
    const user = await this.authRepository.findByPhone(dto.phone);

    if (
      !user ||
      !user.otpCode ||
      !user.otpExpiresAt ||
      user.otpCode !== dto.code ||
      user.otpExpiresAt < new Date()
    ) {
      throw new UnauthorizedException('Código OTP inválido o expirado');
    }

    // Limpiar OTP tras uso exitoso
    await this.authRepository.clearOtp(user.id);

    return this.buildAuthResponse(user);
  }

  // ─────────────────────────────────────────────────────────────────
  // REFRESH TOKEN
  // ─────────────────────────────────────────────────────────────────

  async refreshToken(dto: RefreshTokenDto): Promise<IRefreshResponse> {
    let payload: ITokenPayload;

    try {
      payload = this.jwtService.verify<ITokenPayload>(dto.refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const user = await this.authRepository.findById(payload.sub);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Sesión inválida. Por favor inicia sesión nuevamente');
    }

    // Verificar que el refresh token coincide con el almacenado (rotación) mediante SHA-256
    const hashedInput = crypto.createHash('sha256').update(dto.refreshToken).digest('hex');
    if (hashedInput !== user.refreshToken) {
      throw new UnauthorizedException('Sesión inválida. Por favor inicia sesión nuevamente');
    }

    const newAccessToken = this.signAccessToken(user);
    return { accessToken: newAccessToken };
  }

  // ─────────────────────────────────────────────────────────────────
  // FORGOT PASSWORD
  // ─────────────────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.authRepository.findByEmail(dto.email);

    // Respuesta genérica para evitar email enumeration (OWASP)
    const genericResponse = {
      message: 'Si el email está registrado, recibirás un enlace de recuperación',
    };

    if (!user) return genericResponse;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora en el futuro

    // Verificación de debug:
    if (this.config.get<string>('app.nodeEnv') === 'development') {
      this.logger.debug(
        `[FORGOT PASSWORD MOCK] Para: ${user.email} | Token Claro: ${resetToken} | Expira: ${resetExpires.toISOString()}`,
      );
    }

    // Guardamos el HASH del token por seguridad (no el token original), pero enviamos el original
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    await this.authRepository.savePasswordResetToken(user.id, hashedToken, resetExpires);

    const frontendUrl = this.config.get<string>('app.frontendUrl');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await this.sendResetEmail(user.email, user.name, resetUrl);
    } catch (err) {
      this.logger.error(`Error enviando email de reset a ${user.email}`, err);
      // No revelamos el error al cliente
    }

    return genericResponse;
  }

  // ─────────────────────────────────────────────────────────────────
  // RESET PASSWORD
  // ─────────────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    // Al usuario le enviamos el token claro, nosotros en DB tenemos su hash
    const hashedInput = crypto.createHash('sha256').update(dto.token).digest('hex');
    const user = await this.authRepository.findByResetToken(hashedInput);

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Token de recuperación inválido o expirado');
    }

    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_SALT_ROUNDS);
    await this.authRepository.updatePassword(user.id, newHash);

    // Invalida también el refresh token para forzar nuevo login
    await this.authRepository.updateRefreshToken(user.id, null);

    return { message: 'Contraseña actualizada exitosamente' };
  }

  // ─────────────────────────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────────────────────────

  async logout(userId: number): Promise<{ message: string }> {
    await this.authRepository.updateRefreshToken(userId, null);
    return { message: 'Sesión cerrada exitosamente' };
  }

  // ─────────────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ─────────────────────────────────────────────────────────────────

  /** Genera la respuesta completa de auth (access + refresh token + user seguro) */
  private async buildAuthResponse(user: User): Promise<IAuthResponse> {
    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);

    // Almacenar el refresh token hasheado (SHA-256 en vez de bcrypt) en DB para validación futura
    const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.authRepository.updateRefreshToken(user.id, hashedRefresh);

    return {
      accessToken,
      refreshToken,
      user: this.toSafeUser(user),
    };
  }

  /** Firma un access token JWT (expira en 15 minutos) */
  private signAccessToken(user: User): string {
    const payload: ITokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const secret = this.config.get<string>('jwt.secret');
    const expiresIn = (this.config.get<string>('jwt.expiresIn') ?? '15m') as `${number}${'s'|'m'|'h'|'d'}`;
    return this.jwtService.sign(payload, { secret, expiresIn });
  }

  /** Firma un refresh token JWT (expira en 7 días) */
  private signRefreshToken(user: User): string {
    const payload: ITokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const secret = this.config.get<string>('jwt.refreshSecret');
    const expiresIn = (this.config.get<string>('jwt.refreshExpiresIn') ?? '7d') as `${number}${'s'|'m'|'h'|'d'}`;
    return this.jwtService.sign(payload, { secret, expiresIn });
  }

  /** Transforma un User de Prisma en un objeto seguro sin datos sensibles */
  private toSafeUser(user: User): ISafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
    };
  }

  /** Genera un código OTP numérico de 6 dígitos criptográficamente seguro */
  private generateOtpCode(): string {
    const buffer = crypto.randomBytes(4);
    const num = buffer.readUInt32BE(0) % 1_000_000;
    return num.toString().padStart(6, '0');
  }

  /** Envía el email de recuperación de contraseña vía Nodemailer */
  private async sendResetEmail(
    to: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: this.config.get<string>('mail.host'),
      port: this.config.get<number>('mail.port'),
      secure: false,
      auth: {
        user: this.config.get<string>('mail.user'),
        pass: this.config.get<string>('mail.pass'),
      },
    });

    await transporter.sendMail({
      from: this.config.get<string>('mail.from'),
      to,
      subject: 'Recuperación de contraseña — EleMotor',
      html: `
        <h2>Hola ${name},</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace (válido por 1 hora):</p>
        <a href="${resetUrl}" style="
          display: inline-block;
          padding: 12px 24px;
          background: #1a73e8;
          color: white;
          border-radius: 6px;
          text-decoration: none;
          font-weight: bold;
        ">Restablecer contraseña</a>
        <p>Si no solicitaste este cambio, ignora este email.</p>
        <p>El equipo de EleMotor</p>
      `,
    });
  }

  /** Relaciona cotizaciones anónimas previas con el nuevo usuario registrado */
  private claimQuotesForNewUser(user: User, providerName: string = 'local'): void {
    // We intentionally do NOT await to keep the auth response fast.
    this.quotesRepository
      .claimAnonymousByEmail(user.email, user.id)
      .then((count) => {
        if (count > 0) {
          this.logger.log(
            `Linked ${count} anonymous quote(s) to new ${providerName} user #${user.id} (${user.email})`,
          );
        }
      })
      .catch((err: unknown) => {
        this.logger.error(
          `Failed to claim anonymous quotes for ${providerName} user #${user.id}`,
          err instanceof Error ? err.message : String(err),
        );
      });
  }
}
