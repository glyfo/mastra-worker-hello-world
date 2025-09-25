// src/providers/index.ts
import { createOpenAI } from "@ai-sdk/openai";

/** ---------- tiny helpers ---------- */
const envOf = (ctx?: any) =>
  (ctx?.env ?? ctx ?? (typeof process !== "undefined" ? process.env : {})) as Record<
    string,
    string | undefined
  >;

const need = (cond: any, msg: string) => {
  if (!cond) throw new Error(msg);
};

const gwBase = (acct: string, gw: string, vendor: "openai" | "worker-ai") =>
  `https://gateway.ai.cloudflare.com/v1/${acct}/${gw}/${vendor}/v1`;

/** ---------- model presets ---------- */
export const Models = {
  OpenAI: {
    GPT_4O: "gpt-4o",
    GPT_4O_MINI: "gpt-4o-mini",
  },
  WorkersAI: {
    LLAMA_3_1_8B: "@cf/meta/llama-3.1-8b-instruct",
    MISTRAL_7B: "@cf/mistral/mistral-7b-instruct-v0.1",
  },
} as const;

export type OpenAIModel = (typeof Models.OpenAI)[keyof typeof Models.OpenAI];
export type WorkersAIModel = (typeof Models.WorkersAI)[keyof typeof Models.WorkersAI];

/**
 * v5 provider shape: returns a callable that, when given a model id,
 * yields an AI SDK v5 model function (what Mastra vNext expects).
 */
export type V5Provider = (modelId?: string) => any;

/** Build an AI SDK v5 client pinned to a baseURL/apiKey/headers */
function makeV5Provider(baseURL: string, apiKey: string, headers: Record<string, string> = {}): V5Provider {
  const openaiCompat = createOpenAI({
    baseURL,
    apiKey,
    headers: { "Content-Type": "application/json", ...headers },
  });
  // v5: returning the *callable* that Mastra can invoke: openaiCompat(modelId)
  return (modelId?: string) => openaiCompat(modelId!);
}

/** ---------- concrete providers (AI Gateway required) ---------- */
function openaiViaGateway(ctx?: any): V5Provider {
  const e = envOf(ctx);
  const apiKey = e.OPENAI_API_KEY;
  const accountId = e.CLOUDFLARE_ACCOUNT_ID;
  const gatewayId = e.CLOUDFLARE_GATEWAY_ID;

  need(apiKey, "OPENAI_API_KEY is required");
  need(accountId, "CLOUDFLARE_ACCOUNT_ID is required to use AI Gateway");
  need(gatewayId, "CLOUDFLARE_GATEWAY_ID is required to use AI Gateway");

  const baseURL = gwBase(accountId!, gatewayId!, "openai");
  return makeV5Provider(baseURL, apiKey!, { "CF-AIG-Source": "mastra-agent" });
}

function workersAIViaGateway(
  ctx?: any,
  cfg?: { accountId?: string; gatewayId?: string; apiToken?: string }
): V5Provider {
  const e = envOf(ctx);
  const accountId = cfg?.accountId ?? e.CLOUDFLARE_ACCOUNT_ID;
  const gatewayId = cfg?.gatewayId ?? e.CLOUDFLARE_GATEWAY_ID;
  const apiToken = cfg?.apiToken ?? e.CLOUDFLARE_API_TOKEN;

  need(accountId, "CLOUDFLARE_ACCOUNT_ID is required");
  need(gatewayId, "CLOUDFLARE_GATEWAY_ID is required");
  need(apiToken, "CLOUDFLARE_API_TOKEN is required for Workers AI via Gateway");

  const baseURL = gwBase(accountId!, gatewayId!, "worker-ai");
  return makeV5Provider(baseURL, apiToken!, { "CF-AIG-Source": "mastra-agent" });
}

/** ---------- public factory (no auto) ---------- */
export const MastraProviders = {
  /** OpenAI → ALWAYS through Cloudflare AI Gateway (v5) */
  openai: (config?: { context?: any }) => openaiViaGateway(config?.context),

  /** Workers AI → ALWAYS through Cloudflare AI Gateway (v5) */
  workerai: (config?: { context?: any; accountId?: string; gatewayId?: string; apiToken?: string }) =>
    workersAIViaGateway(config?.context, config),
} as const;

export default MastraProviders;
