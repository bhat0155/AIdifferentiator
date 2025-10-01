import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  provider() {
    return 'openai' as const;
  }
  modelName() {
    return 'gpt-4o-mini';
  }

  // Real streaming
  streamResponse(prompt: string): Observable<string> {
    return new Observable<string>((sub) => {
      (async () => {
        try {
          const stream = await this.client.chat.completions.create({
            model: this.modelName(),
            stream: true,
            messages: [{ role: 'user', content: prompt }],
          });

          for await (const event of stream) {
            const piece = event?.choices?.[0]?.delta?.content ?? '';
            if (piece) sub.next(piece);
          }

          sub.complete();
        } catch (err) {
          sub.error(err);
        }
      })();
    });
  }

  // Heuristic token math
  countTokens(text: string) {
    return Math.ceil(text.length / 4);
  }

  estimateCostUSD(tokens: number) {
    // Suppose you decide: $0.03 per 1K input + $0.06 per 1K output
    // If tokens is output tokens, multiply by 0.06 / 1000 = 0.00006
    const outputRatePer1k = 0.06;
    return Number((tokens * (outputRatePer1k / 1000)).toFixed(6));
  }
}
