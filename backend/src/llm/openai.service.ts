import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class OpenAIService {
  // 👉 Identity (used in DB rows, UI labels, and SSE)
  provider() {
    return 'openai' as const;
  }
  modelName() {
    return 'gpt-4o-mini';
  }

  // 👉 MVP stream: emit word chunks; replace with real SDK streaming later
  streamResponse(prompt: string): Observable<string> {
    const text = `OpenAI response to: ${prompt}. This is a mocked stream for development to test SSE and UI.`;
    const words = text.split(' ');

    return new Observable<string>((sub) => {
      let i = 0;
      const iv = setInterval(() => {
        if (i >= words.length) {
          clearInterval(iv);
          sub.complete();
          return;
        }
        sub.next(words[i++] + ' ');
      }, 55); // slightly faster to demonstrate interleaving
      return () => clearInterval(iv);
    });
  }

  // 👉 Heuristic token math (documented as approximate)
  countTokens(text: string) {
    return Math.ceil(text.length / 4);
  }

  // 👉 Flat per-1K price (combined in/out) for MVP
  estimateCostUSD(tokens: number) {
    const pricePer1k = 0.15;
    return Number(((tokens * pricePer1k) / 1000).toFixed(6));
  }

  // 👉 Dry-run helper: collect the stream and compute metrics including latency
  async runOnce(prompt: string) {
    const started = Date.now();
    const full = await new Promise<string>((resolve) => {
      let acc = '';
      this.streamResponse(prompt).subscribe({
        next: (chunk) => (acc += chunk),
        complete: () => resolve(acc),
      });
    });
    const responseTimeMs = Date.now() - started;
    const tokenCount = this.countTokens(full);
    const costUSD = this.estimateCostUSD(tokenCount);
    return { text: full, responseTimeMs, tokenCount, costUSD };
  }
}
