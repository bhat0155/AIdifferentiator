import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config'; // Import ConfigModule
import { PrismaModule } from 'prisma/prisma.module';
import { SessionsModule } from './sessions/sessions.module';
import { LlmModule } from './llm/llm.module';

@Module({
  imports: [
    // Add the ConfigModule to the imports array.
    // We use .env.example for defining the variables,
    // but in a real app, developers would copy this to .env (which is ignored by git).
    ConfigModule.forRoot({
      envFilePath: '.env.example',
      isGlobal: true, // Makes the variables available everywhere
    }),
    PrismaModule,
    SessionsModule,
    LlmModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
