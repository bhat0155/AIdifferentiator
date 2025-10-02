import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from 'prisma/prisma.module';
import { SessionsModule } from './sessions/sessions.module';
import { LlmModule } from './llm/llm.module';

import { CompareModule } from './compare/compare.modules';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    // Only @Module() classes here
    ConfigModule.forRoot({
      isGlobal: true, // load env from process.env
      // For local-only you could set envFilePath: '.env'
    }),
    PrismaModule,
    SessionsModule,
    LlmModule,
    CompareModule,
  ],
  controllers: [
    // All @Controller() classes here
    AppController,
    HealthController,
  ],
  providers: [
    // All @Injectable() providers here
    AppService,
  ],
})
export class AppModule {}
