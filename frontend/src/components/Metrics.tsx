'use client';

/**
 * Metrics — shows final timing and cost after a model completes.
 * Appears only when all values are present.
 */
export default function Metrics(props: {
  responseTimeMs?: number;
  tokenCount?: number;
  costUSD?: number;
}) {
  const { responseTimeMs, tokenCount, costUSD } = props;
  const isReady =
    typeof responseTimeMs === 'number' &&
    typeof tokenCount === 'number' &&
    typeof costUSD === 'number';

  if (!isReady) return null;

  return (
    <div className="mt-3 rounded-lg border bg-gray-50 p-3 text-xs text-gray-700">
      <div className="mb-1 font-semibold text-gray-800">Metrics</div>
      <dl className="grid grid-cols-3 gap-2">
        <div>
          <dt className="text-[11px] uppercase text-gray-500">Latency</dt>
          <dd className="font-medium">{responseTimeMs} ms</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase text-gray-500">Tokens (est.)</dt>
          <dd className="font-medium">{tokenCount}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase text-gray-500">Cost (est.)</dt>
          <dd className="font-medium">${costUSD}</dd>
        </div>
      </dl>
    </div>
  );
}