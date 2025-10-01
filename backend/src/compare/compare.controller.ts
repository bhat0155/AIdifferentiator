import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { OpenAIService } from '../llm/openai.service';
import { GeminiService } from '../llm/gemini.service';
import { SessionService } from '../sessions/sessions.service';

@Controller('api/compare')
export class CompareController {
  constructor(
    private readonly openai: OpenAIService,
    private readonly gemini: GeminiService,
    private readonly sessions: SessionService,
  ) {}

  // GET /api/compare/stream?prompt=...
  // Core SSE endpoint:
  // 1) create a DB session (fast insert),
  // 2) start both model streams in parallel,
  // 3) emit interleaved chunk events,
  // 4) persist each model's final text+metrics when it completes.
  @Get('stream')
  async stream(@Query('prompt') prompt: string, @Res() res: Response) {
    // --- Basic guard (we keep it simple; DTO for query is overkill here)
    if (!prompt || !prompt.trim()) {
      res.status(400).json({ message: 'prompt is required' });
      return;
    }

    // --- SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // --- Phase 1: create the session immediately (fast insert)
    const session = await this.sessions.create(prompt);
    res.write(
      `data: ${JSON.stringify({ type: 'session', sessionId: session.id })}\n\n`,
    );

    // Accumulators + timing for per-model metrics
    let oText = '';
    let gText = '';
    const oStart = Date.now();
    const gStart = Date.now();
    let oDone = false;
    let gDone = false;

    // End the SSE when both models finish
    const maybeEnd = () => {
      if (oDone && gDone) {
        res.write(`data: ${JSON.stringify({ type: 'all-complete' })}\n\n`);
        res.end();
      }
    };

    // Handle client disconnects to avoid writing to a closed socket
    const req = (res as any).req as import('http').IncomingMessage;
    const onClose = () => {
      oSub?.unsubscribe();
      gSub?.unsubscribe();
    };
    req.on('close', onClose);

    // --- Start OpenAI stream
    const oSub = this.openai.streamResponse(prompt).subscribe({
      next: (chunk) => {
        oText += chunk;
        res.write(
          `data: ${JSON.stringify({ type: 'chunk', modelId: 'openai', data: chunk })}\n\n`,
        );
      },
      error: (err) => {
        oDone = true;
        res.write(
          `data: ${JSON.stringify({
            type: 'status',
            modelId: 'openai',
            status: 'error',
            message: String(err),
          })}\n\n`,
        );
        maybeEnd();
      },

      // here, first metrics will be computed->stored in db -> then sent to frontend
      complete: async () => {
        const ms = Date.now() - oStart;
        const tokens = this.openai.countTokens(oText);
        const cost = this.openai.estimateCostUSD(tokens);

        try {
          await this.sessions.saveModelResult({
            sessionId: session.id,
            provider: this.openai.provider(),
            modelName: this.openai.modelName(),
            responseText: oText,
            tokenCount: tokens,
            costUSD: cost,
            responseTimeMs: ms,
          });
        } catch {
          res.write(
            `data: ${JSON.stringify({
              type: 'status',
              modelId: 'openai',
              status: 'error',
              message: 'Failed to save OpenAI result',
            })}\n\n`,
          );
        }

        res.write(
          `data: ${JSON.stringify({
            type: 'status',
            modelId: 'openai',
            status: 'complete',
            metrics: { responseTimeMs: ms, tokenCount: tokens, costUSD: cost },
          })}\n\n`,
        );
        oDone = true;
        maybeEnd();
      },
    });

    // --- Start Gemini stream
    const gSub = this.gemini.streamResponse(prompt).subscribe({
      next: (chunk) => {
        gText += chunk;
        res.write(
          `data: ${JSON.stringify({ type: 'chunk', modelId: 'gemini', data: chunk })}\n\n`,
        );
      },
      error: (err) => {
        gDone = true;
        res.write(
          `data: ${JSON.stringify({
            type: 'status',
            modelId: 'gemini',
            status: 'error',
            message: String(err),
          })}\n\n`,
        );
        maybeEnd();
      },
      complete: async () => {
        const ms = Date.now() - gStart;
        const tokens = this.gemini.countTokens(gText);
        const cost = this.gemini.estimateCostUSD(tokens);

        try {
          await this.sessions.saveModelResult({
            sessionId: session.id,
            provider: this.gemini.provider(),
            modelName: this.gemini.modelName(),
            responseText: gText,
            tokenCount: tokens,
            costUSD: cost,
            responseTimeMs: ms,
          });
        } catch {
          res.write(
            `data: ${JSON.stringify({
              type: 'status',
              modelId: 'gemini',
              status: 'error',
              message: 'Failed to save Gemini result',
            })}\n\n`,
          );
        }

        res.write(
          `data: ${JSON.stringify({
            type: 'status',
            modelId: 'gemini',
            status: 'complete',
            metrics: { responseTimeMs: ms, tokenCount: tokens, costUSD: cost },
          })}\n\n`,
        );
        gDone = true;
        maybeEnd();
      },
    });
  }
}
