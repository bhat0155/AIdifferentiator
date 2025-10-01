import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Use the ConfigService to reliably get the PORT from environment
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields
      forbidNonWhitelisted: false, // (true would 400 on unknown; we’ll keep false for MVP)
      transform: true, // auto-cast primitives (e.g., "123" -> 123)
    }),
  );

  const port = configService.get<number>('PORT');

  await app.listen(port || 3001); // Default to 3001 if reading fails

  console.log(`🚀 Backend is running on: http://localhost:${port || 3001}`);
}
bootstrap();
