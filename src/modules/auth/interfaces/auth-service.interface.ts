import { IAuthResponse, IRefreshResponse } from './auth-response.interface';
import {
  RegisterDto,
  LoginDto,
  GoogleAuthDto,
  OtpSendDto,
  OtpVerifyDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto';

/**
 * Contrato del servicio de autenticación.
 * Facilita testing con mocks y desacopla la implementación del controlador.
 */
export interface IAuthService {
  register(dto: RegisterDto): Promise<IAuthResponse>;
  login(dto: LoginDto): Promise<IAuthResponse>;
  googleAuth(dto: GoogleAuthDto): Promise<IAuthResponse>;
  sendOtp(dto: OtpSendDto): Promise<{ message: string }>;
  verifyOtp(dto: OtpVerifyDto): Promise<IAuthResponse>;
  refreshToken(dto: RefreshTokenDto): Promise<IRefreshResponse>;
  forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }>;
  resetPassword(dto: ResetPasswordDto): Promise<{ message: string }>;
  logout(userId: number): Promise<{ message: string }>;
}
