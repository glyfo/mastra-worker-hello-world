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

export { Models } from "./types";

/** Helpers */
const envOf = (ctx?: any) =>
  (ctx?.env ?? ctx ?? (typeof process !== "undefined" ? process.env : {})) as Record<string, string | undefined>;
const need = (cond: any, msg: string) => { if (!cond) throw new Error(msg); };

/** v5 provider type */
export type V5Provider = (modelId?: string) => any;

/**
 * Build an AI SDK v5 client pinned to baseURL/apiKey/headers.
 * We explicitly set Authorization: Bearer <apiKey> and force Chat Completions.
 */
function makeV5Provider(
  baseURL: string,          // MUST end in '/v1/' (types.cfGatewayBase does this)
  apiKey: string,           // OPENAI_API_KEY or CLOUDFLARE_API_TOKEN
  extraHeaders: Record<string, string> = {}
): V5Provider {
  const openaiCompat = createOpenAI({
    baseURL,
    apiKey, // the SDK also sets Authorization, but we set it explicitly too (belt & suspenders)
    headers: {
      ...Headers.JSON,
      ...extraHeaders,
      Authorization: `Bearer ${apiKey}`, // <— Explicit Bearer header
    },
  });

  // Always use the OpenAI-compatible Chat Completions path: /v1/chat/completions
  return (modelId?: string) => openaiCompat.chat(modelId!);
}

/** ---------- OpenAI via Gateway ---------- */
function openaiViaGateway(ctx?: any): V5Provider {
  const e = envOf(ctx);
  const apiKey    = e[Env.OPENAI_API_KEY];
  const accountId = e[Env.CF_ACCOUNT_ID];
  const gatewayId = e[Env.CF_GATEWAY_ID];

  need(apiKey && apiKey !== "dummy", Errors.OPENAI_KEY_REQUIRED);
  need(accountId, Errors.CF_ACCOUNT_REQUIRED);
  need(gatewayId, Errors.CF_GATEWAY_REQUIRED);

  const baseURL = cfGatewayBase(accountId!, gatewayId!, Vendors.OPENAI); // .../openai/v1/
  return makeV5Provider(baseURL, apiKey!, Headers.Source);
}

/** ---------- Workers AI via Gateway ---------- */
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

  const baseURL = cfGatewayBase(accountId!, gatewayId!, Vendors.WORKERS_AI); // .../workers-ai/v1/
  return makeV5Provider(baseURL, apiToken!, Headers.Source);
}

/** Public factory (no auto) */
export const MastraProviders = {
  openai:    (config?: { context?: any }) => openaiViaGateway(config?.context),
  workersai: (config?: { context?: any; accountId?: string; gatewayId?: string; apiToken?: string }) =>
               workersAIViaGateway(config?.context, config),
} as const;

export default MastraProviders;
