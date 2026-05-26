import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { AppointmentsRepository } from './appointments.repository';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly repo: AppointmentsRepository,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateAppointmentDto) {
    const appointment = await this.repo.create(dto);

    // Fire-and-forget — don't block the HTTP response on email delivery
    this.sendNotificationEmail(appointment).catch((err) =>
      this.logger.error('Error enviando notificación de cita', err),
    );

    return { message: 'Solicitud recibida. Te contactaremos pronto.', id: appointment.id };
  }

  private async sendNotificationEmail(appointment: {
    id: number;
    name: string;
    email: string;
    phone: string;
    preferredDate: Date;
    preferredTime: string | null;
    serviceType: string;
    notes: string | null;
    workshop: { name: string; address: string | null; city: string | null; email: string | null; phone: string | null } | null;
  }): Promise<void> {
    const notifyTo = this.config.get<string>('mail.appointmentsTo');
    if (!notifyTo) {
      this.logger.warn('APPOINTMENTS_NOTIFY_EMAIL no configurado — email omitido');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: this.config.get<string>('mail.host'),
      port: this.config.get<number>('mail.port'),
      secure: false,
      auth: {
        user: this.config.get<string>('mail.user'),
        pass: this.config.get<string>('mail.pass'),
      },
    });

    const dateStr = appointment.preferredDate.toISOString().split('T')[0];
    const timeStr = appointment.preferredTime ?? 'No especificada';
    const workshopStr = appointment.workshop
      ? `${appointment.workshop.name}${appointment.workshop.city ? ` — ${appointment.workshop.city}` : ''}`
      : 'No especificado';

    const row = (label: string, value: string, last = false) => `
      <tr>
        <td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;color:#444444;background-color:#f7f7f7;border-bottom:${last ? 'none' : '1px solid #e0e0e0'};width:38%;vertical-align:top;">${label}</td>
        <td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:14px;color:#222222;border-bottom:${last ? 'none' : '1px solid #e0e0e0'};vertical-align:top;">${value}</td>
      </tr>`;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Nueva cita de mantenimiento</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f0f0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color:#0a2e22;padding:28px 32px;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:2px;color:#00d4aa;text-transform:uppercase;">EleMotor · Servicio Técnico</p>
              <h1 style="margin:8px 0 4px;font-family:Arial,sans-serif;font-size:22px;font-weight:bold;color:#ffffff;">Nueva solicitud de mantenimiento</h1>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#7ab8a0;">Cita&nbsp;#${appointment.id} &nbsp;·&nbsp; Recibida el ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#555555;">Se recibió una nueva solicitud de cita a través del sitio web. Aquí están los detalles:</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:6px;overflow:hidden;border:1px solid #e0e0e0;">
                ${row('Cliente', appointment.name)}
                ${row('Correo', `<a href="mailto:${appointment.email}" style="color:#0a7c5c;text-decoration:none;">${appointment.email}</a>`)}
                ${row('Teléfono', appointment.phone)}
                ${row('Servicio', appointment.serviceType)}
                ${row('Fecha preferida', dateStr)}
                ${row('Hora preferida', timeStr)}
                ${row('Taller', workshopStr, !appointment.notes)}
                ${appointment.notes ? row('Notas', appointment.notes, true) : ''}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f7f7f7;padding:16px 32px;border-top:1px solid #e0e0e0;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#999999;text-align:center;">EleMotor DMS &mdash; Sistema de gestión de citas &mdash; Este correo fue generado automáticamente.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `Nueva cita de mantenimiento #${appointment.id}

Cliente: ${appointment.name}
Correo: ${appointment.email}
Teléfono: ${appointment.phone}
Servicio: ${appointment.serviceType}
Fecha preferida: ${dateStr}
Hora preferida: ${timeStr}
Taller: ${workshopStr}${appointment.notes ? `\nNotas: ${appointment.notes}` : ''}
`;

    await transporter.sendMail({
      from: this.config.get<string>('mail.from'),
      to: notifyTo,
      replyTo: appointment.email,
      subject: `Nueva cita de mantenimiento — ${appointment.name} (${dateStr})`,
      html,
      text,
    });
  }
}
