// src/lib/utils.ts

/**
 * Extracts a plain string from various Mastra generate() / generateVNext() results.
 * Falls back to JSON if no obvious text field is present.
 */
export function extractText(r: any): string {
  if (typeof r === 'string') return r;
  if (typeof r?.text === 'string') return r.text;
  if (typeof r?.outputText === 'string') return r.outputText;
  if (typeof r?.output === 'string') return r.output;
  return JSON.stringify(r);
}

/**
 * Tiny logger — swap with a real logger later (Workers console is fine).
 */
export function trace(msg: string, data?: unknown) {
  // eslint-disable-next-line no-console
  console.info('[App]', msg, data);
}

