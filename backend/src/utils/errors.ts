// backend/src/utils/errors.ts
export type NormalizedError = {
  status?: number;
  code?: string;
  userMessage: string; // short, safe text for the UI
  logMessage: string; // detailed server-side log
};

export function normalizeProviderError(
  err: any,
  provider: 'openai' | 'google',
): NormalizedError {
  const name = provider === 'openai' ? 'OpenAI' : 'Gemini';

  // Try to extract status/code/message from different SDK shapes
  const status =
    err?.status ?? err?.statusCode ?? err?.response?.status ?? undefined;

  const code =
    err?.code ??
    err?.error?.code ??
    err?.response?.data?.error?.code ??
    undefined;

  const rawMsg =
    err?.message ??
    err?.error?.message ??
    err?.response?.data?.error?.message ??
    String(err ?? '');

  // Friendly text for the user (no URLs, no stack traces)
  let userMessage = `${name}: Something went wrong. Please try again.`;

  if (status === 401) {
    userMessage = `${name}: Invalid or missing API key. Check your key in the backend .env.`;
  } else if (status === 429) {
    userMessage = `${name}: Rate limit or quota exceeded. Please try again later.`;
  } else if (status === 400) {
    userMessage = `${name}: Bad request. Try simplifying or shortening the prompt.`;
  } else if (typeof status === 'number' && status >= 500) {
    userMessage = `${name}: Service is temporarily unavailable. Please retry shortly.`;
  } else if (rawMsg) {
    // fallback: trim noisy details/links
    userMessage = `${name}: ${rawMsg.replace(/https?:\/\/\S+/g, '').slice(0, 200)}`;
  }

  // Richer message for server logs
  const logMessage = `${name} error (status=${status ?? 'n/a'} code=${code ?? 'n/a'}): ${rawMsg}`;

  return { status, code, userMessage, logMessage };
}
