import { OpenAIService } from '../src/llm/openai.service';
import { GeminiService } from '../src/llm/gemini.service';

async function main() {
  const openai = new OpenAIService();
  const gemini = new GeminiService();

  // Log first 5 chunks (manual subscription)
  const prompt = 'hello world';
  console.log('--- First 5 OpenAI chunks ---');
  await new Promise<void>((resolve) => {
    let count = 0;
    openai.streamResponse(prompt).subscribe({
      next: (chunk) => {
        if (count++ < 5) console.log(chunk.trim());
      },
      complete: () => resolve(),
    });
  });

  console.log('--- First 5 Gemini chunks ---');
  await new Promise<void>((resolve) => {
    let count = 0;
    gemini.streamResponse(prompt).subscribe({
      next: (chunk) => {
        if (count++ < 5) console.log(chunk.trim());
      },
      complete: () => resolve(),
    });
  });

  // Run full stream once and print metrics
  const o = await openai.runOnce(prompt);
  const g = await gemini.runOnce(prompt);
  console.log('\nOpenAI metrics:', o);
  console.log('Gemini metrics:', g);
}
main();
