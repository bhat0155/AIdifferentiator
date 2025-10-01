import { Module } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { GeminiService } from './gemini.service';

@Module({
  providers: [OpenAIService, GeminiService],
  exports: [OpenAIService, GeminiService],
})
export class LlmModule {}
