import { Module } from '@nestjs/common';
import { CompareController } from './compare.controller';
import { SessionsModule } from 'src/sessions/sessions.module';
import { LlmModule } from 'src/llm/llm.module';

@Module({
  imports: [SessionsModule, LlmModule],
  controllers: [CompareController],
})
export class CompareModule {}
