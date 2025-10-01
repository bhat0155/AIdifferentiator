import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get configuration service instance
  const configService = app.get(ConfigService);

  // Use config service to retrieve the CORS origin, falling back to localhost:3000
  const corsOrigin =
    configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000';

  // --- CORS Configuration ---
  app.enableCors({
    origin: corsOrigin, // Explicitly allow requests from the frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields
      forbidNonWhitelisted: false,
      transform: true, // auto-cast primitives (e.g., "123" -> 123)
    }),
  );

  const port = configService.get<number>('PORT');

  await app.listen(port || 3001); // Default to 3001 if reading fails

  console.log(`CORS enabled for origin: ${corsOrigin}`);
  console.log(`🚀 Backend is running on: http://localhost:${port || 3001}`);
}
bootstrap();
