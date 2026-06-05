import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

/**
 * MailService — Servicio centralizado de envío de correos via Gmail SMTP.
 *
 * El transporter se crea una única vez en el constructor y se reutiliza en
 * cada envío (pool de conexiones implícito de nodemailer).
 *
 * IMPORTANTE — MAIL_PASS debe ser una Contraseña de Aplicación de Google,
 * NO la contraseña normal de la cuenta de Gmail.
 * Pasos para obtenerla:
 *   1. https://myaccount.google.com/security
 *   2. Activar Verificación en 2 pasos.
 *   3. Buscar "Contraseñas de aplicación".
 *   4. Crear una para "Correo / Otro (nombre personalizado)".
 *   5. Usar la clave de 16 caracteres resultante como MAIL_PASS.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('mail.from') ?? 'EleMotor DMS <noreply@elemotor.co>';

    // Gmail SMTP — STARTTLS en puerto 587 (secure: false).
    // Para TLS implícito (puerto 465) cambiar a: port: 465, secure: true.
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('mail.host') ?? 'smtp.gmail.com',
      port: this.config.get<number>('mail.port') ?? 587,
      secure: false, // STARTTLS — Gmail puerto 587
      auth: {
        user: this.config.get<string>('mail.user'),
        pass: this.config.get<string>('mail.pass'), // Contraseña de Aplicación de Google
      },
    });
  }

  // ─── Métodos públicos ──────────────────────────────────────────────────────

  /**
   * sendQuoteNotification — Notifica al equipo comercial que se recibió una
   * nueva cotización/lead desde el sitio web.
   *
   * @param quote Datos básicos de la cotización a incluir en el correo.
   */
  async sendQuoteNotification(quote: {
    referenceCode: string;
    name: string;
    email: string;
    phone: string;
    city?: string | null;
    modelName?: string | null;
    trimName?: string | null;
    preferredChannel?: string | null;
    source?: string | null;
    notes?: string | null;
  }): Promise<void> {
    const notifyTo = this.config.get<string>('mail.appointmentsTo');
    if (!notifyTo) {
      this.logger.warn('APPOINTMENTS_NOTIFY_EMAIL no configurado — notificación de cotización omitida');
      return;
    }

    const row = (label: string, value: string, last = false) => `
      <tr>
        <td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;color:#444444;background-color:#f7f7f7;border-bottom:${last ? 'none' : '1px solid #e0e0e0'};width:38%;vertical-align:top;">${label}</td>
        <td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:14px;color:#222222;border-bottom:${last ? 'none' : '1px solid #e0e0e0'};vertical-align:top;">${value}</td>
      </tr>`;

    const vehiculo = [quote.modelName, quote.trimName].filter(Boolean).join(' — ') || 'No especificado';
    const hasNotes = !!quote.notes;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Nueva cotización ${quote.referenceCode}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f0f0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color:#0a2e22;padding:28px 32px;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:2px;color:#00d4aa;text-transform:uppercase;">EleMotor · Ventas</p>
              <h1 style="margin:8px 0 4px;font-family:Arial,sans-serif;font-size:22px;font-weight:bold;color:#ffffff;">Nueva cotización recibida</h1>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#7ab8a0;">Ref: ${quote.referenceCode} &nbsp;·&nbsp; ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#555555;">Se recibió una nueva solicitud de cotización a través del sitio web.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:6px;overflow:hidden;border:1px solid #e0e0e0;">
                ${row('Cliente', quote.name)}
                ${row('Correo', `<a href="mailto:${quote.email}" style="color:#0a7c5c;text-decoration:none;">${quote.email}</a>`)}
                ${row('Teléfono', quote.phone)}
                ${quote.city ? row('Ciudad', quote.city) : ''}
                ${row('Vehículo de interés', vehiculo)}
                ${quote.preferredChannel ? row('Canal preferido', quote.preferredChannel) : ''}
                ${quote.source ? row('Fuente', quote.source) : ''}
                ${quote.notes ? row('Notas', quote.notes, true) : row('Referencia', quote.referenceCode, !hasNotes)}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f7f7f7;padding:16px 32px;border-top:1px solid #e0e0e0;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#999999;text-align:center;">EleMotor DMS &mdash; Sistema de gestión &mdash; Este correo fue generado automáticamente.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `Nueva cotización ${quote.referenceCode}

Cliente: ${quote.name}
Correo: ${quote.email}
Teléfono: ${quote.phone}${quote.city ? `\nCiudad: ${quote.city}` : ''}
Vehículo de interés: ${vehiculo}${quote.preferredChannel ? `\nCanal preferido: ${quote.preferredChannel}` : ''}${quote.source ? `\nFuente: ${quote.source}` : ''}${quote.notes ? `\nNotas: ${quote.notes}` : ''}
`;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: notifyTo,
        replyTo: quote.email,
        subject: `Nueva cotización ${quote.referenceCode} — ${quote.name}`,
        html,
        text,
      });
      this.logger.log(`Notificación de cotización enviada: ${quote.referenceCode}`);
    } catch (err) {
      this.logger.error(`Error enviando notificación de cotización ${quote.referenceCode}`, err);
      throw err;
    }
  }

  /**
   * sendWelcomeEmail — Envía un correo de bienvenida al cliente cuando se
   * registra por primera vez en el sistema.
   *
   * @param user Datos básicos del nuevo usuario.
   */
  async sendWelcomeEmail(user: {
    name: string;
    email: string;
  }): Promise<void> {
    const firstName = user.name.split(' ')[0];

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Bienvenido a EleMotor</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f0f0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color:#0a2e22;padding:28px 32px;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:2px;color:#00d4aa;text-transform:uppercase;">EleMotor · Bienvenida</p>
              <h1 style="margin:8px 0 4px;font-family:Arial,sans-serif;font-size:22px;font-weight:bold;color:#ffffff;">Hola, ${firstName}!</h1>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#7ab8a0;">Tu cuenta en EleMotor DMS ha sido creada</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;color:#333333;">Bienvenido a <strong>EleMotor</strong>, tu plataforma para gestionar vehículos eléctricos.</p>
              <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#555555;">Ya puedes iniciar sesión con tu correo <strong>${user.email}</strong> y consultar el estado de tus cotizaciones y pedidos.</p>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555555;">Si tienes alguna pregunta, responde a este correo o contáctanos directamente.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f7f7f7;padding:16px 32px;border-top:1px solid #e0e0e0;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#999999;text-align:center;">EleMotor DMS &mdash; Este correo fue generado automáticamente. Por favor no respondas directamente.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `Hola, ${firstName}!

Bienvenido a EleMotor. Tu cuenta ha sido creada con el correo: ${user.email}.

Ya puedes iniciar sesión y consultar el estado de tus cotizaciones y pedidos.

Si tienes alguna pregunta, contáctanos.

— Equipo EleMotor
`;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: user.email,
        subject: `Bienvenido a EleMotor, ${firstName}!`,
        html,
        text,
      });
      this.logger.log(`Correo de bienvenida enviado a: ${user.email}`);
    } catch (err) {
      this.logger.error(`Error enviando correo de bienvenida a ${user.email}`, err);
      throw err;
    }
  }

  // ─── Utilidad interna ──────────────────────────────────────────────────────

  /**
   * verifyConnection — Verifica que el transporter puede autenticarse con
   * Gmail SMTP. Útil para un health-check en arranque o en pruebas manuales.
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Conexión SMTP Gmail verificada correctamente');
      return true;
    } catch (err) {
      this.logger.error('Fallo al verificar conexión SMTP Gmail', err);
      return false;
    }
  }
}
