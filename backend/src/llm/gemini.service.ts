import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  // Create the Gemini client using your backend .env key
  private genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  // Identity helpers (used in SSE payloads and DB rows)
  provider() {
    return 'google' as const;
  }
  modelName() {
    return 'gemini-2.5-flash';
  }

  /**
   * Real streaming via Google Generative AI.
   * Emits incremental text chunks as they arrive; completes when the model finishes.
   */
  streamResponse(prompt: string): Observable<string> {
    return new Observable<string>((sub) => {
      (async () => {
        try {
          const model = this.genAI.getGenerativeModel({
            model: this.modelName(),
          });

          // Start a streaming generation (async iterable of chunks)
          const result = await model.generateContentStream({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          });

          // Iterate over the stream and push out text pieces
          for await (const chunk of result.stream) {
            // Safely extract the incremental text (shape can vary per SDK version)
            const piece =
              chunk?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (piece) sub.next(piece);
          }

          sub.complete();
        } catch (err) {
          // Surface the error to the SSE controller; it will emit status:error to FE
          sub.error(err);
        }
      })();
    });
  }

  // MVP heuristics for your metrics table
  countTokens(text: string) {
    return Math.ceil(text.length / 4);
  }

  estimateCostUSD(tokens: number) {
    // Using output rate $2.50 per million tokens
    const outputRatePer1k = 2.5 / 1000; // = $0.0025 per 1000 tokens
    return Number((tokens * outputRatePer1k).toFixed(6));
  }
}
