'use client';

/**
 * T10 — SSE Listener (Frontend)
 *
 * Adds:
 *  - A single EventSource connection to backend SSE endpoint
 *  - Robust message handling: session | chunk | status
 *  - State updates into Zustand store (appendChunk / setStatus / setMetrics)
 *  - Careful cleanup: close previous EventSource on new run or unmount
 */

import { FormEvent, useCallback, useEffect, useRef } from 'react';
import Panel from '@/components/Panel';
import StatusBadge from '@/components/StatusBadge';
import { usePlayground } from '@/store/usePlayground';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function HomePage() {
  const {
    prompt,
    setPrompt,
    reset,
    models,
    appendChunk,
    setStatus,
    setMetrics,
  } = usePlayground();

  // Keep the active EventSource instance here so we can close it between runs
  const esRef = useRef<EventSource | null>(null);

  // For now we store sessionId locally (MVP). You can lift to Zustand later if needed.
  const sessionIdRef = useRef<string | null>(null);

  // Helper: close the current EventSource safely
  const closeStream = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }, []);

  // Cleanup if component unmounts
  useEffect(() => {
    return () => closeStream();
  }, [closeStream]);

  // Submit: reset UI, flip statuses to streaming, open SSE, route events into Zustand
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!prompt.trim()) return;

      // 1) Clear previous run so both panels start fresh
      reset();

      // 2) Visual feedback immediately (SSE will drive final statuses)
      setStatus('openai', 'streaming');
      setStatus('gemini', 'streaming');

      // 3) Close any previous stream to avoid duplicates/leaks
      closeStream();

      // 4) Build the SSE URL (encode prompt!)
      const url = `${BACKEND}/api/compare/stream?prompt=${encodeURIComponent(prompt)}`;

      // 5) Open a single EventSource for the whole run
      const es = new EventSource(url);
      esRef.current = es;

      // --- onmessage: all server events arrive here as text lines with "data: ..."
      es.onmessage = (evt) => {
        // Each message is a JSON string of shape:
        // { type: 'session'|'chunk'|'status', ... }
        try {
          const payload = JSON.parse(evt.data);

          // 5a) Session announcement — capture sessionId for later GET /api/sessions/:id
          if (payload.type === 'session') {
            sessionIdRef.current = payload.sessionId;
            return;
          }

          // 5b) Streaming chunk — append it to the right model
          if (payload.type === 'chunk') {
            const { modelId, data } = payload as {
              modelId: 'openai' | 'gemini';
              data: string;
            };
            appendChunk(modelId, data);
            return;
          }

          // 5c) Status updates — "complete" (with metrics) or "error"
          if (payload.type === 'status') {
            const { modelId, status } = payload as {
              modelId: 'openai' | 'gemini';
              status: 'complete' | 'error';
              metrics?: { responseTimeMs: number; tokenCount: number; costUSD: number };
              message?: string;
            };

            if (status === 'complete' && payload.metrics) {
              // Fill metrics first so UI has data when status flips
              setMetrics(modelId, payload.metrics);
              setStatus(modelId, 'complete');
            } else if (status === 'error') {
              // Mark just this model as errored; the other may still be streaming/complete
              setStatus(modelId, 'error');
              // Optional: append a visible error note into the text area
              appendChunk(modelId, `\n\n[Error] ${payload.message ?? 'Provider failed'}\n`);
            }
            return;
          }

          // (Optional) all-complete — server may send a final epilogue
          if (payload.type === 'all-complete') {
            // We can safely close here; setStatus already flipped both to "complete" or "error"
            closeStream();
            return;
          }
        } catch {
          // Ignore malformed frames (defensive — should not happen)
          return;
        }
      };

      // --- onerror: network/server issue (MVP: mark both errored and close)
      es.onerror = () => {
        // If still streaming, surface an error for both models
        if (models.openai.status === 'streaming') setStatus('openai', 'error');
        if (models.gemini.status === 'streaming') setStatus('gemini', 'error');
        closeStream();
      };
    },
    [prompt, reset, setStatus, appendChunk, setMetrics, models.openai.status, models.gemini.status, closeStream]
  );

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-20">
      {/* Sticky top bar so users can quickly re-run */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-black/60">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl gap-2">
          {/* Accessibility: label is visually hidden but still helps screen readers */}
          <label htmlFor="prompt" className="sr-only">
            Prompt
          </label>

          <input
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Ask something to compare (e.g., "WebSockets vs SSE with examples")`}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Comparison prompt input"
          />

          <button
            type="submit"
            className="shrink-0 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
            aria-label="Submit prompt"
          >
            Submit
          </button>
        </form>
      </div>

      {/* Two responsive columns (OpenAI | Gemini) */}
      <div className="mx-auto mt-6 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
        <Panel
          title="OpenAI (gpt-4o-mini)"
          right={<StatusBadge status={models.openai.status} />}
        >
          {models.openai.text || (
            <p className="text-gray-500">
              OpenAI output will stream here as chunks once you submit.
            </p>
          )}
        </Panel>

        <Panel
          title="Gemini (gemini-2.5-flash)"
          right={<StatusBadge status={models.gemini.status} />}
        >
          {models.gemini.text || (
            <p className="text-gray-500">
              Gemini output will stream here as chunks once you submit.
            </p>
          )}
        </Panel>
      </div>

      {/* Helper text */}
      <div className="mx-auto mt-6 max-w-5xl text-xs text-gray-500">
        <p>
          Tip: Open DevTools → Network → find the request of type <code>event-stream</code>. You’ll see
          <code>session</code>, <code>chunk</code>, and <code>status</code> events arriving live.
        </p>
      </div>
    </main>
  );
}