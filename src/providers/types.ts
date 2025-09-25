// src/providers/types.ts

/** Vendors (Cloudflare AI Gateway provider slugs) */
export const Vendors = {
  OPENAI: "openai",
  WORKERS_AI: "workers-ai",
} as const;
export type Vendor = typeof Vendors[keyof typeof Vendors];

/** Canonical model ids (string literal types preserved via `as const`) */
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

/** Opinionated defaults per provider */
export const DefaultModels = {
  OPENAI: Models.OpenAI.GPT_4O_MINI,
  WORKERS_AI: Models.WorkersAI.LLAMA_3_1_8B,
} as const;

/** Common headers and metadata */
export const Headers = {
  JSON: { "Content-Type": "application/json" },
  Source: { "CF-AIG-Source": "mastra-agent" },
} as const;

/** Env var names used across the project */
export const Env = {
  CF_ACCOUNT_ID: "CLOUDFLARE_ACCOUNT_ID",
  CF_GATEWAY_ID: "CLOUDFLARE_GATEWAY_ID",
  OPENAI_API_KEY: "OPENAI_API_KEY",
  CF_API_TOKEN: "CLOUDFLARE_API_TOKEN",
} as const;

/** Error messages (centralized) */
export const Errors = {
  OPENAI_KEY_REQUIRED: "OPENAI_API_KEY is required (not 'dummy').",
  CF_ACCOUNT_REQUIRED: "CLOUDFLARE_ACCOUNT_ID is required to use AI Gateway.",
  CF_GATEWAY_REQUIRED: "CLOUDFLARE_GATEWAY_ID is required to use AI Gateway.",
  CF_TOKEN_REQUIRED: "CLOUDFLARE_API_TOKEN is required for Workers AI via Gateway.",
} as const;

/** Utility to build a Cloudflare AI Gateway base URL */
export const cfGatewayBase = (accountId: string, gatewayId: string, vendor: Vendor) =>
  `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/${vendor}/v1`;
