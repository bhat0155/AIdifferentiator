import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config'; // Import ConfigService

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Use the ConfigService to reliably get the PORT from environment
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT');

  await app.listen(port || 3001); // Default to 3001 if reading fails

  console.log(`🚀 Backend is running on: http://localhost:${port || 3001}`);
}
bootstrap();
