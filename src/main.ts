import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // ─── CORS ────────────────────────────────────────────────────────────────────
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  
  // Agregar explicitly 3001 para soportar el hot-reload actual del frontend sin tener que reiniciar para leer el .env
  const allowedOrigins = [
    ...frontendUrl.split(','),
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // ─── Prefijo global de rutas ─────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ─── Validación global de DTOs ───────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina campos no declarados en el DTO
      forbidNonWhitelisted: true, // Lanza error si llegan campos extra
      transform: true, // Convierte automáticamente tipos primitivos
    }),
  );

  // ─── Filtros globales de excepciones ───────────────────────────────────────
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new PrismaExceptionFilter(),
  );

  // ─── Swagger ─────────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('EleMotor DMS API')
    .setDescription(
      'API del sistema de gestión de distribuidores (Dealer Management System) de EleMotor Colombia',
    )
    .setVersion('1.0')
    .addTag('health', 'Estado del servicio')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // ─── Puerto ──────────────────────────────────────────────────────────────────
  const port = parseInt(process.env.PORT ?? '4000', 10);
  await app.listen(port);

  // ─── Logs de inicio ──────────────────────────────────────────────────────────
  logger.log(`🚀 Server running on:   http://localhost:${port}`);
  logger.log(`📡 API Base:            http://localhost:${port}/api`);
  logger.log(`📋 Swagger docs:        http://localhost:${port}/api/docs`);
  logger.log(`❤️  Health check:        http://localhost:${port}/api/health`);
  logger.log(
    `🌍 Environment:         ${process.env.NODE_ENV ?? 'development'}`,
  );
}

bootstrap().catch((err) => {
  console.error('❌ Error starting server', err);
  process.exit(1);
});
