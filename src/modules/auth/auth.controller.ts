import {
  Controller,
  Post,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { IAuthService } from './interfaces/auth-service.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginThrottlerGuard } from './guards/login-throttler.guard';
import { Public } from './decorators/public.decorator';
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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('IAuthService') private readonly authService: IAuthService,
  ) {}

  // ─────────────────────────────────────────────────────────────────
  // POST /api/auth/register
  // ─────────────────────────────────────────────────────────────────
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo usuario con email y contraseña' })
  @ApiResponse({ status: 201, description: 'Usuario creado. Retorna access y refresh token.' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos (validación de DTO).' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /api/auth/login — Rate limited: 5 intentos/min por IP
  // ─────────────────────────────────────────────────────────────────
  @Public()
  @UseGuards(LoginThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión con email y contraseña' })
  @ApiResponse({ status: 200, description: 'Login exitoso. Retorna access y refresh token.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos. Rate limit excedido.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /api/auth/google
  // ─────────────────────────────────────────────────────────────────
  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticar con Google OAuth (ID Token)' })
  @ApiBody({ type: GoogleAuthDto })
  @ApiResponse({ status: 200, description: 'Autenticación Google exitosa.' })
  @ApiResponse({ status: 401, description: 'Token de Google inválido o expirado.' })
  googleAuth(@Body() dto: GoogleAuthDto) {
    return this.authService.googleAuth(dto);
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /api/auth/otp/send
  // ─────────────────────────────────────────────────────────────────
  @Public()
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar código OTP por WhatsApp/SMS (mock en desarrollo)' })
  @ApiResponse({ status: 200, description: 'OTP enviado (o ignorado si el número no existe).' })
  sendOtp(@Body() dto: OtpSendDto) {
    return this.authService.sendOtp(dto);
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /api/auth/otp/verify
  // ─────────────────────────────────────────────────────────────────
  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar código OTP y obtener JWT' })
  @ApiResponse({ status: 200, description: 'OTP válido. Retorna access y refresh token.' })
  @ApiResponse({ status: 401, description: 'Código OTP inválido o expirado.' })
  verifyOtp(@Body() dto: OtpVerifyDto) {
    return this.authService.verifyOtp(dto);
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /api/auth/refresh
  // ─────────────────────────────────────────────────────────────────
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  @ApiResponse({ status: 200, description: 'Nuevo access token generado.' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado.' })
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /api/auth/forgot-password
  // ─────────────────────────────────────────────────────────────────
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar email de recuperación de contraseña' })
  @ApiResponse({ status: 200, description: 'Email enviado (respuesta genérica por seguridad).' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // ─────────────────────────────────────────────────────────────────
  // PUT /api/auth/reset-password
  // ─────────────────────────────────────────────────────────────────
  @Public()
  @Put('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña con token de recuperación' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado.' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /api/auth/logout — Requiere autenticación
  // ─────────────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión e invalidar refresh token' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  logout(@Request() req: { user: ITokenPayload }) {
    return this.authService.logout(req.user.sub);
  }
}
