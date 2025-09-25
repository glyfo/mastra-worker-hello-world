// src/providers/index.ts
import { createOpenAI } from "@ai-sdk/openai";
import {
  Vendors,
  Headers,
  Env,
  Errors,
  cfGatewayBase,
  Models, // re-exported below
} from "./types";

/** Re-export models so consumers can `import { Models } from "../providers"` */
export { Models } from "./types";

/** ---------- tiny helpers ---------- */
const envOf = (ctx?: any) =>
  (ctx?.env ?? ctx ?? (typeof process !== "undefined" ? process.env : {})) as Record<
    string,
    string | undefined
  >;

const need = (cond: any, msg: string) => {
  if (!cond) throw new Error(msg);
};

/** v5 provider type used by Mastra */
export type V5Provider = (modelId?: string) => any;

/**
 * Build an AI SDK v5 client pinned to a baseURL/apiKey/headers.
 * IMPORTANT: we return the Chat Completions client explicitly to avoid hitting /v1/responses.
 */
function makeV5Provider(
  baseURL: string,
  apiKey: string,
  extraHeaders: Record<string, string> = {}
): V5Provider {
  const openaiCompat = createOpenAI({
    baseURL,                // MUST end with '/v1/' -> ensured by cfGatewayBase()
    apiKey,                 // Bearer token (OpenAI key or CF API token)
    headers: { ...Headers.JSON, ...extraHeaders },
  });

  // Force OpenAI-compatible Chat Completions endpoint: /v1/chat/completions
  return (modelId?: string) => openaiCompat.chat(modelId!);
}

/** ---------- concrete providers (AI Gateway required) ---------- */
function openaiViaGateway(ctx?: any): V5Provider {
  const e = envOf(ctx);
  const apiKey    = e[Env.OPENAI_API_KEY];
  const accountId = e[Env.CF_ACCOUNT_ID];
  const gatewayId = e[Env.CF_GATEWAY_ID];

  need(apiKey && apiKey !== "dummy", Errors.OPENAI_KEY_REQUIRED);
  need(accountId, Errors.CF_ACCOUNT_REQUIRED);
  need(gatewayId, Errors.CF_GATEWAY_REQUIRED);

  // Produces: https://gateway.ai.cloudflare.com/v1/<acct>/<gw>/openai/v1/
  const baseURL = cfGatewayBase(accountId!, gatewayId!, Vendors.OPENAI);
  return makeV5Provider(baseURL, apiKey!, Headers.Source);
}

function workersAIViaGateway(
  ctx?: any,
  cfg?: { accountId?: string; gatewayId?: string; apiToken?: string }
): V5Provider {
  const e = envOf(ctx);
  const accountId = cfg?.accountId ?? e[Env.CF_ACCOUNT_ID];
  const gatewayId = cfg?.gatewayId ?? e[Env.CF_GATEWAY_ID];
  const apiToken  = cfg?.apiToken  ?? e[Env.CF_API_TOKEN];

  need(accountId, Errors.CF_ACCOUNT_REQUIRED);
  need(gatewayId, Errors.CF_GATEWAY_REQUIRED);
  need(apiToken && apiToken !== "dummy", Errors.CF_TOKEN_REQUIRED);

  // Produces: https://gateway.ai.cloudflare.com/v1/<acct>/<gw>/workers-ai/v1/
  const baseURL = cfGatewayBase(accountId!, gatewayId!, Vendors.WORKERS_AI);
  return makeV5Provider(baseURL, apiToken!, Headers.Source);
}

/** ---------- public factory (no auto) ---------- */
export const MastraProviders = {
  openai:    (config?: { context?: any }) => openaiViaGateway(config?.context),
  workersai: (config?: { context?: any; accountId?: string; gatewayId?: string; apiToken?: string }) =>
               workersAIViaGateway(config?.context, config),
} as const;

export default MastraProviders;
