import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';

/**
 * MailModule — Módulo centralizado de envío de correos.
 *
 * Usa nodemailer directamente (ya instalado) con Gmail SMTP vía STARTTLS
 * (puerto 587, secure: false).
 *
 * IMPORTANTE — Gmail requiere una Contraseña de Aplicación, NO la contraseña
 * normal de la cuenta. Para generarla:
 *   1. Ir a: https://myaccount.google.com/security
 *   2. Activar la Verificación en 2 pasos (si no está activa).
 *   3. Buscar "Contraseñas de aplicación" en el buscador de la cuenta.
 *   4. Crear una nueva contraseña para "Correo / Otro (nombre personalizado)".
 *   5. Copiar la contraseña de 16 caracteres generada y usarla como MAIL_PASS.
 *
 * Variables de entorno requeridas (ver .env.example):
 *   MAIL_HOST   — smtp.gmail.com
 *   MAIL_PORT   — 587
 *   MAIL_USER   — tu cuenta Gmail (ej. notificaciones@gmail.com)
 *   MAIL_PASS   — Contraseña de Aplicación de Google (16 chars, sin espacios)
 *   MAIL_FROM   — Nombre y dirección del remitente (ej. "EleMotor <notificaciones@gmail.com>")
 */
@Module({
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
