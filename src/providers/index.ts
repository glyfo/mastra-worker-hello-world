// src/providers/index.ts
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

/** ---------- tiny helpers ---------- */
const envOf = (ctx?: any) =>
  (ctx?.env ?? ctx ?? (typeof process !== 'undefined' ? process.env : {})) as Record<string, string | undefined>;

const need = (cond: any, msg: string) => { if (!cond) throw new Error(msg); };
const gwBase = (acct: string, gw: string, vendor: 'openai' | 'cloudflare') =>
  `https://gateway.ai.cloudflare.com/v1/${acct}/${gw}/${vendor}/v1`;

/** ---------- model presets ---------- */
export const Models = {
  OpenAI: {
    GPT_4O: 'gpt-4o',
    GPT_4O_MINI: 'gpt-4o-mini',
  },
  WorkersAI: {
    LLAMA_3_1_8B: '@cf/meta/llama-3.1-8b-instruct',
    MISTRAL_7B: '@cf/mistral/mistral-7b-instruct-v0.1',
  },
} as const;

/** shape returned by provider getters */
type ProviderCallable = (modelId?: string) => {
  name: string;
  baseURL: string;
  apiKey: string;
  headers: Record<string, string>;
  model?: string;
};

/** minimal provider wrapper */
function makeProvider(
  name: 'openai' | 'cloudflare',
  baseURL: string,
  apiKey: string,
  headers: Record<string, string> = {}
): ProviderCallable {
  // create the compatible client (we only reuse connection info here)
  createOpenAICompatible({ name, baseURL, apiKey, headers: { 'Content-Type': 'application/json', ...headers } });
  const core = { name, baseURL, apiKey, headers: { 'Content-Type': 'application/json', ...headers } };
  return (modelId?: string) => ({ ...core, model: modelId });
}

/** ---------- concrete providers (AI Gateway required) ---------- */
function openaiViaGateway(ctx?: any): ProviderCallable {
  const e = envOf(ctx);
  const apiKey     = e.OPENAI_API_KEY;
  const accountId  = e.CLOUDFLARE_ACCOUNT_ID;
  const gatewayId  = e.CLOUDFLARE_GATEWAY_ID;

  need(apiKey,    'OPENAI_API_KEY is required');
  need(accountId, 'CLOUDFLARE_ACCOUNT_ID is required to use AI Gateway');
  need(gatewayId, 'CLOUDFLARE_GATEWAY_ID is required to use AI Gateway');

  const baseURL = gwBase(accountId!, gatewayId!, 'openai');
  return makeProvider('openai', baseURL, apiKey!, { 'CF-AIG-Source': 'mastra-agent' });
}

function workersAIViaGateway(ctx?: any, cfg?: { accountId?: string; gatewayId?: string; apiToken?: string }): ProviderCallable {
  const e = envOf(ctx);
  const accountId = cfg?.accountId ?? e.CLOUDFLARE_ACCOUNT_ID;
  const gatewayId = cfg?.gatewayId ?? e.CLOUDFLARE_GATEWAY_ID;
  const apiToken  = cfg?.apiToken  ?? e.CLOUDFLARE_API_TOKEN;

  need(accountId, 'CLOUDFLARE_ACCOUNT_ID is required');
  need(gatewayId, 'CLOUDFLARE_GATEWAY_ID is required');
  need(apiToken,  'CLOUDFLARE_API_TOKEN is required for Workers AI via Gateway');

  const baseURL = gwBase(accountId!, gatewayId!, 'cloudflare');
  return makeProvider('cloudflare', baseURL, apiToken!, { 'CF-AIG-Source': 'mastra-agent' });
}

/** ---------- public factory ---------- */
export const MastraProviders = {
  /** OpenAI → ALWAYS through AI Gateway */
  openai: (config?: { context?: any }) => openaiViaGateway(config?.context),

  /** Workers AI → ALWAYS through AI Gateway */
  cloudflare: (config?: { context?: any; accountId?: string; gatewayId?: string; apiToken?: string }) =>
    workersAIViaGateway(config?.context, config),

  /** Auto-pick: prefers Workers AI via Gateway if CF vars present; otherwise OpenAI via Gateway */
  auto: (ctx?: any) => {
    const e = envOf(ctx);
    const hasCF = !!(e.CLOUDFLARE_ACCOUNT_ID && e.CLOUDFLARE_GATEWAY_ID);
    if (hasCF && e.CLOUDFLARE_API_TOKEN) return workersAIViaGateway(ctx);
    if (hasCF && e.OPENAI_API_KEY)       return openaiViaGateway(ctx);
    // If both missing, be explicit so devs know to add gateway vars
    throw new Error('AI Gateway required: set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_GATEWAY_ID (+ provider creds).');
  },
} as const;

export default MastraProviders;
