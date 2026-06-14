import { Controller, Get, Post, Body, HttpCode } from '@nestjs/common';
import { MailService } from './mail.service';

/**
 * MailController — Endpoints de diagnóstico para verificar la configuración SMTP.
 *
 * NOTA: Estos endpoints son solo para pruebas. Elimina este controlador
 * (y su referencia en MailModule) una vez confirmado que el correo funciona.
 *
 * GET  /api/mail/verify      → Verifica autenticación SMTP sin enviar correo
 * POST /api/mail/test        → Envía un correo de prueba a la dirección indicada
 */
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  /** Verifica que nodemailer pueda autenticarse con el servidor SMTP. */
  @Get('verify')
  async verify() {
    const ok = await this.mailService.verifyConnection();
    return {
      ok,
      message: ok
        ? 'Conexión SMTP verificada correctamente ✓'
        : 'Error al conectar con el servidor SMTP. Revisa MAIL_USER y MAIL_PASS.',
    };
  }

  /** Envía un correo de prueba real a la dirección indicada. */
  @Post('test')
  @HttpCode(200)
  async sendTest(@Body() body: { to?: string }) {
    const to = body.to;
    if (!to) return { ok: false, message: 'Debes enviar { "to": "destino@correo.com" } en el body.' };

    await this.mailService.sendWelcomeEmail({ name: 'Usuario de Prueba', email: to });
    return { ok: true, message: `Correo de prueba enviado a ${to}` };
  }
}
