'use client';

import { usePlayground } from '@/store/usePlayground';
import React from 'react';

export default function ZustandTestPage() {
  const {
    prompt, setPrompt, reset,
    models, appendChunk, setStatus, setMetrics,
  } = usePlayground();

  const fakeStream = async () => {
    reset();
    setStatus('openai', 'streaming');
    setStatus('gemini', 'streaming');

    const openaiChunks = ['Hello ', 'from ', 'OpenAI ', 'model.'];
    const geminiChunks = ['Hi ', 'from ', 'Gemini ', 'model.'];

    for (let i = 0; i < openaiChunks.length; i++) {
      appendChunk('openai', openaiChunks[i]);
      await new Promise((r) => setTimeout(r, 120));
      appendChunk('gemini', geminiChunks[i]);
      await new Promise((r) => setTimeout(r, 120));
    }

    setStatus('openai', 'complete');
    setMetrics('openai', { responseTimeMs: 456, tokenCount: 123, costUSD: 0.0005 });

    setStatus('gemini', 'complete');
    setMetrics('gemini', { responseTimeMs: 512, tokenCount: 111, costUSD: 0.0004 });
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Zustand Store Smoke Test</h1>

      <div className="flex gap-2">
        <input
          className="border rounded px-3 py-2 flex-1"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type a prompt (stored in Zustand)"
        />
        <button
          className="px-3 py-2 rounded bg-black text-white"
          onClick={fakeStream}
        >
          Run Fake Stream
        </button>
        <button
          className="px-3 py-2 rounded border"
          onClick={reset}
        >
          Reset
        </button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(['openai', 'gemini'] as const).map((m) => (
          <div key={m} className="border rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{m.toUpperCase()}</h3>
              <span className="text-xs border rounded px-2 py-1">
                {models[m].status}
              </span>
            </div>
            <pre className="whitespace-pre-wrap text-sm">
              {models[m].text || '(empty)'}
            </pre>
            {models[m].metrics && (
              <div className="mt-2 text-xs">
                <div>Latency: {models[m].metrics.responseTimeMs} ms</div>
                <div>Tokens: {models[m].metrics.tokenCount}</div>
                <div>Cost: ${models[m].metrics.costUSD}</div>
              </div>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}