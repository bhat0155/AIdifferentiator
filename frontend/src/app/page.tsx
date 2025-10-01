'use client';

/**
 * T9 — UI Layout & Prompt Interaction (no SSE yet)
 *
 * This page provides:
 *  - Sticky prompt bar at the top with input + submit
 *  - Two responsive columns (OpenAI | Gemini) each with a status badge
 *  - Hooks into the Zustand store to read prompt and statuses
 *
 * NOTE:
 *  - We call reset() and setStatus() on submit for visual feedback now.
 *  - In T10, we'll open EventSource and update text/metrics live.
 */

import { FormEvent, useCallback } from 'react';
import Panel from '@/components/Panel';
import StatusBadge from '@/components/StatusBadge';
import { usePlayground } from '@/store/usePlayground';

export default function HomePage() {
  // Pull state/actions from global store (created in T8)
  const {
    prompt,
    setPrompt,
    reset,
    models,
    setStatus,
  } = usePlayground();

  // Submit handler (UI-only in T9; real SSE wiring arrives in T10)
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();

      // Guard: empty prompt — keep it minimal for MVP
      if (!prompt.trim()) return;

      // 1) Clear any previous run (so panels start fresh)
      reset();

      // 2) Flip both models to "streaming" to indicate progress
      //    (In T10 the SSE messages will drive these updates)
      setStatus('openai', 'streaming');
      setStatus('gemini', 'streaming');

      // 3) T10 — Open EventSource here and pipe events -> Zustand actions
    },
    [prompt, reset, setStatus]
  );

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-20">
      {/* Sticky top bar so users can quickly re-run */}
      <div className="sticky top-0 z-10 -mx-4  px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-black/60">
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

      {/* Two responsive columns.
         - On mobile: they stack (1 column)
         - On md+ screens: two columns side-by-side */}
      <div className="mx-auto mt-6 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
        {/* OPENAI COLUMN */}
        <Panel
          title="OpenAI (gpt-4o-mini)"
          right={<StatusBadge status={models.openai.status} />}
        >
          {/* T9: show placeholder (no SSE yet). T10 will stream into models.openai.text */}
          {models.openai.text || (
            <p className="text-gray-500">
              OpenAI output will stream here once you submit (wired in T10).
            </p>
          )}
        </Panel>

        {/* GEMINI COLUMN */}
        <Panel
          title="Gemini (gemini-2.5-flash)"
          right={<StatusBadge status={models.gemini.status} />}
        >
          {models.gemini.text || (
            <p className="text-gray-500">
              Gemini output will stream here once you submit (wired in T10).
            </p>
          )}
        </Panel>
      </div>

      {/* Small helper text — explains what's next */}
      <div className="mx-auto mt-6 max-w-5xl text-xs text-gray-500">
        <p>
          Tip: After clicking <strong>Submit</strong>, both models switch to <em>streaming</em>.
          In <strong>T10</strong> we’ll wire the real SSE stream so content appears live here.
        </p>
      </div>
    </main>
  );
}