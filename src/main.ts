import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // ─── Prefijo global de rutas ─────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ─── Validación global de DTOs ───────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina campos no declarados en el DTO
      forbidNonWhitelisted: true, // Lanza error si llegan campos extra
      transform: true, // Convierte automáticamente tipos primitivos
    }),
  );

  // ─── Filtro global de excepciones ────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ─── Puerto configurable desde .env ──────────────────────────────────────
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  // ─── Logs de inicio del servidor ─────────────────────────────────────────
  logger.log(`🚀 Server running on: http://localhost:${port}`);
  logger.log(`📡 API Base:          http://localhost:${port}/api`);
  logger.log(`🔌 Test DB endpoint:  http://localhost:${port}/api/test-db`);
  logger.log(`🌍 Environment:       ${process.env.NODE_ENV ?? 'development'}`);
}

bootstrap().catch((err) => {
  console.error('Error starting server', err);
  process.exit(1);
});
