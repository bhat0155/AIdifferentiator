import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class GeminiService {
  // 👉 A simple "identity card" for this service.
  //    - provider(): used in DB rows and SSE events to know which vendor responded.
  //    - modelName(): the actual model name (helps when you want to switch models).
  provider() {
    return 'google' as const;
  }
  modelName() {
    return 'gemini-2.5-flash';
  }

  // 👉 Fake streaming for MVP.
  //    Instead of calling the real Gemini API, we generate a string response,
  //    split it into words, and "drip-feed" them one by one with setInterval.
  //    Why? So we can build and test our SSE pipeline without spending tokens.
  streamResponse(prompt: string): Observable<string> {
    const text = `Gemini response to: ${prompt}. This simulates real-time chunked output for development.`;
    const words = text.split(' ');

    // Observable is the perfect wrapper here:
    // - sub.next(...) sends one "chunk" to whoever is listening (our SSE controller later).
    // - sub.complete() closes the stream when done.
    return new Observable<string>((sub) => {
      let i = 0;
      const iv = setInterval(() => {
        if (i >= words.length) {
          clearInterval(iv);
          sub.complete(); // 🚪 signal "all chunks delivered"
          return;
        }
        sub.next(words[i++] + ' '); // 📦 push out one more word
      }, 70); // 70ms gap: slightly slower cadence than OpenAI to simulate "interleaving"
      return () => clearInterval(iv); // cleanup if client disconnects
    });
  }

  // 👉 Very rough "token count" heuristic.
  //    In reality, models tokenize text differently,
  //    but for MVP we just assume ~4 characters = 1 token.
  countTokens(text: string) {
    return Math.ceil(text.length / 4);
  }

  // 👉 Estimate the "cost" in USD.
  //    We pretend this model costs $0.10 per 1K tokens.
  //    This is enough for a metrics table, without needing real billing.
  estimateCostUSD(tokens: number) {
    const pricePer1k = 0.1;
    return Number(((tokens * pricePer1k) / 1000).toFixed(6));
  }

  // 👉 Utility method for testing this service in isolation (no SSE).
  //    - Collects ALL chunks into one final string
  //    - Measures latency (start → finish)
  //    - Calculates tokenCount and cost
  //    - Returns everything as a metrics object
  async runOnce(prompt: string) {
    const started = Date.now();
    const full = await new Promise<string>((resolve) => {
      let acc = '';
      this.streamResponse(prompt).subscribe({
        next: (chunk) => (acc += chunk), // keep appending chunks
        complete: () => resolve(acc), // when complete, return the full text
      });
    });
    const responseTimeMs = Date.now() - started;
    const tokenCount = this.countTokens(full);
    const costUSD = this.estimateCostUSD(tokenCount);

    // Final shape matches what we'll later store in DB & show in UI
    return { text: full, responseTimeMs, tokenCount, costUSD };
  }
}
