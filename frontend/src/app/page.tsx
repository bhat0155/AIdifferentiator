'use client';

/**
 * AIDifferentiator — Main Page
 *
 * T9: UI layout with sticky prompt bar + two model columns
 * T10: SSE listener — open a single EventSource to backend and push events into Zustand
 * T11: Render streaming text as Markdown + show metrics after completion
 */

import { FormEvent, useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Panel from '@/components/Panel';
import StatusBadge from '@/components/StatusBadge';
import Metrics from '@/components/Metrics';
import { usePlayground } from '@/store/usePlayground';

// FE env var: set in .env.local → NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function HomePage() {
  // Zustand: central state/actions (from T8)
  const {
    prompt,
    setPrompt,
    reset,
    models,
    appendChunk,
    setStatus,
    setMetrics,
  } = usePlayground();

  // Keep exactly one open EventSource per run
  const esRef = useRef<EventSource | null>(null);

  // Optional: hold sessionId for later GET /api/sessions/:id (history view)
  const sessionIdRef = useRef<string | null>(null);

  // Helper: close current EventSource if any
  const closeStream = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }, []);

  // Cleanup on unmount (avoid dangling connections)
  useEffect(() => {
    return () => closeStream();
  }, [closeStream]);

  // Submit handler:
  //  - Clear previous run
  //  - Flip statuses to "streaming"
  //  - Open SSE (EventSource) and route events into Zustand
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!prompt.trim()) return;

      // 1) Fresh run
      reset();
      setPrompt("");

      // 2) Instant visual feedback — SSE will drive final states/metrics
      setStatus('openai', 'streaming');
      setStatus('gemini', 'streaming');

      // 3) Ensure only one EventSource is open
      closeStream();

      // 4) Build SSE URL (encode prompt!)
      const url = `${BACKEND}/api/compare/stream?prompt=${encodeURIComponent(prompt)}`;

      // 5) Open SSE
      const es = new EventSource(url);
      esRef.current = es;

      // All server events arrive as text lines with "data: ...".
      es.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);

          // Session announcement — useful for history fetch later
          if (payload.type === 'session') {
            sessionIdRef.current = payload.sessionId;
            return;
          }

          // Streaming chunk — append to the correct model
          if (payload.type === 'chunk') {
            const { modelId, data } = payload as {
              modelId: 'openai' | 'gemini';
              data: string;
            };
            appendChunk(modelId, data);
            return;
          }

          // Status updates — "complete" (with metrics) or "error"
          if (payload.type === 'status') {
            const { modelId, status, metrics, message } = payload as {
              modelId: 'openai' | 'gemini';
              status: 'complete' | 'error';
              metrics?: { responseTimeMs: number; tokenCount: number; costUSD: number };
              message?: string;
            };

            if (status === 'complete' && metrics) {
              // write metrics first, then flip status to complete
              setMetrics(modelId, metrics);
              setStatus(modelId, 'complete');
            } else if (status === 'error') {
              setStatus(modelId, 'error');
              // optional: surface a small inline error note
              appendChunk(modelId, `\n\n[Error] ${message ?? 'Provider failed'}\n`);
            }
            return;
          }

          // Final epilogue — safe to close
          if (payload.type === 'all-complete') {
            closeStream();
            return;
          }
        } catch {
          // Ignore any malformed frame (defensive)
        }
      };

      // Network/server error: mark any still-streaming model as error, then close
      es.onerror = () => {
        if (models.openai.status === 'streaming') setStatus('openai', 'error');
        if (models.gemini.status === 'streaming') setStatus('gemini', 'error');
        closeStream();
      };
    },
    [
      prompt,
      reset,
      setStatus,
      appendChunk,
      setMetrics,
      models.openai.status,
      models.gemini.status,
      closeStream,
    ],
  );

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-20">
      {/* ───────────────────────── Sticky Prompt/Search Bar ───────────────────────── */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-black/60">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl gap-2">
          {/* Accessible label (screen-reader visible) */}
          <label htmlFor="prompt" className="sr-only">
            Prompt
          </label>

          {/* The “search bar” / input */}
          <input
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Ask something to compare (e.g., "WebSockets vs SSE with examples")`}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Comparison prompt input"
          />

          {/* Submit triggers the SSE flow */}
          <button
            type="submit"
            className="shrink-0 border rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
            aria-label="Submit prompt"
          >
            Submit
          </button>
        </form>
      </div>

      {/* ───────────────────────── Two Responsive Columns ───────────────────────── */}
     <div className="mx-auto mt-6 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
  {/* OPENAI COLUMN: panel + metrics stacked */}
  <div className="flex flex-col gap-2">
    <Panel
      title="OpenAI (gpt-4o-mini)"
      right={<StatusBadge status={models.openai.status} />}
    >
      {models.openai.text ? (
        <ReactMarkdown>{models.openai.text}</ReactMarkdown>
      ) : (
        <p className="text-gray-500">
          OpenAI output will stream here as Markdown once you submit.
        </p>
      )}
    </Panel>

    <Metrics
      responseTimeMs={models.openai.metrics?.responseTimeMs}
      tokenCount={models.openai.metrics?.tokenCount}
      costUSD={models.openai.metrics?.costUSD}
    />
  </div>

  {/* GEMINI COLUMN: panel + metrics stacked */}
  <div className="flex flex-col gap-2">
    <Panel
      title="Gemini (gemini-2.5-flash)"
      right={<StatusBadge status={models.gemini.status} />}
    >
      {models.gemini.text ? (
        <ReactMarkdown>{models.gemini.text}</ReactMarkdown>
      ) : (
        <p className="text-gray-500">
          Gemini output will stream here as Markdown once you submit.
        </p>
      )}
    </Panel>

    <Metrics
      responseTimeMs={models.gemini.metrics?.responseTimeMs}
      tokenCount={models.gemini.metrics?.tokenCount}
      costUSD={models.gemini.metrics?.costUSD}
    />
  </div>
</div>

    </main>
  );
}