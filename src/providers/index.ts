/**
 * Simplified LLM Provider for Mastra Agents
 * Supports OpenAI and Cloudflare Workers AI
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// Safe environment accessor that works in Node, Cloudflare Workers and Deno
function getEnv(key: string): string | undefined {
  try {
    // Node.js
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof process !== 'undefined' && (process as any)?.env) return (process as any).env[key];
  } catch (e) {
    // ignore
  }

  try {
    // Cloudflare Workers and other globals
    // @ts-ignore
    if (typeof globalThis !== 'undefined' && (globalThis as any)?.[key]) return (globalThis as any)[key];
  } catch (e) {
    // ignore
  }

  try {
    // Deno
    // @ts-ignore
    if (typeof Deno !== 'undefined' && Deno.env) return Deno.env.get(key);
  } catch (e) {
    // ignore
  }

  return undefined;
}

// Type definitions
export type ProviderType = 'openai' | 'workers-ai' | 'cloudflare';

export interface BaseConfig {
  type: ProviderType;
  headers?: Record<string, string>;
}

export interface OpenAIConfig extends BaseConfig {
  type: 'openai';
  apiKey?: string;
  baseURL?: string;
}

export interface WorkersAIConfig extends BaseConfig {
  type: 'workers-ai' | 'cloudflare';
  accountId?: string;
  gatewayId?: string;
  apiToken?: string;
}

export type MastraConfig = OpenAIConfig | WorkersAIConfig;

export interface OpenAICompatibleProvider {
  name: string;
  baseURL: string;
  apiKey: string;
  headers: Record<string, string>;
}

export interface ModelFunction {
  (modelName?: string): OpenAICompatibleProvider & { model?: string };
}

export class MastraLLMProvider {
  private config: MastraConfig;
  private provider: OpenAICompatibleProvider | null = null;

  constructor(config: MastraConfig) {
    this.config = config;
    this.initialize();
  }

  private initialize(): void {
    const { type, ...providerConfig } = this.config;
    
    if (!type) {
      throw new Error('Provider type is required. Use "openai" or "workers-ai"');
    }

    switch (type.toLowerCase()) {
      case 'openai':
        this.provider = this.createOpenAIProvider(providerConfig as Omit<OpenAIConfig, 'type'>);
        break;
      case 'workers-ai':
      case 'cloudflare':
        this.provider = this.createWorkersAIProvider(providerConfig as Omit<WorkersAIConfig, 'type'>);
        break;
      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }
  }

  private createOpenAIProvider(config: Omit<OpenAIConfig, 'type'>): OpenAICompatibleProvider {
    const {
      apiKey = getEnv('OPENAI_API_KEY'),
      baseURL = 'https://api.openai.com/v1',
      headers = {}
    } = config;

    if (!apiKey) {
      throw new Error('OpenAI API Key is required. Set OPENAI_API_KEY environment variable or pass apiKey in config');
    }

    const provider = createOpenAICompatible({
      name: 'openai',
      baseURL,
      apiKey,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });

    return {
      name: provider?.name ?? 'openai',
      baseURL,
      apiKey,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      // Merge any other properties from the underlying provider implementation
      ...(provider as unknown as Record<string, unknown>)
    } as OpenAICompatibleProvider;
  }

  private createWorkersAIProvider(config: Omit<WorkersAIConfig, 'type'>): OpenAICompatibleProvider {
    const {
      accountId = getEnv('CLOUDFLARE_ACCOUNT_ID'),
      gatewayId = getEnv('CLOUDFLARE_GATEWAY_ID'),
      apiToken = getEnv('CLOUDFLARE_API_TOKEN'),
      headers = {}
    } = config;

    if (!accountId || !gatewayId || !apiToken) {
      throw new Error(
        'Cloudflare credentials required: accountId, gatewayId, apiToken. ' +
        'Set environment variables or pass in config'
      );
    }

    const baseURL = this.buildWorkersAIUrl(accountId, gatewayId);

    const provider = createOpenAICompatible({
      name: 'workers-ai',
      baseURL,
      apiKey: apiToken,
      headers: {
        'CF-AIG-Source': 'mastra-agent',
        'Content-Type': 'application/json',
        ...headers
      }
    });

    return {
      name: provider?.name ?? 'workers-ai',
      baseURL,
      apiKey: apiToken,
      headers: {
        'CF-AIG-Source': 'mastra-agent',
        'Content-Type': 'application/json',
        ...headers
      },
      ...(provider as unknown as Record<string, unknown>)
    } as OpenAICompatibleProvider;
  }

  private buildWorkersAIUrl(accountId: string, gatewayId: string): string {
    return `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/workers-ai/v1`;
  }

  /**
   * Get provider instance for Mastra agents
   * Returns a function that accepts a model name
   */
  public getProvider(defaultModel?: string): ModelFunction {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    
    return (modelName?: string) => ({
      ...this.provider!,
      model: modelName || defaultModel
    });
  }

  /**
   * Direct provider access — returns a callable that accepts a model name
   */
  public get(): ModelFunction {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const providerCopy = this.provider;
    return (modelName?: string) => ({
      ...providerCopy,
      model: modelName
    });
  }

  /**
   * Get provider type
   */
  public getType(): ProviderType {
    return this.config.type;
  }

  /**
   * Check if provider is initialized
   */
  public isReady(): boolean {
    return this.provider !== null;
  }

  /**
   * Get provider info without exposing sensitive data
   */
  public getInfo(): { type: ProviderType; name: string; ready: boolean } {
    return {
      type: this.config.type,
      name: this.provider?.name || 'unknown',
      ready: this.isReady()
    };
  }
}

/**
 * Factory functions for easy setup
 */
export const MastraProviders = {
  /**
   * Create OpenAI provider
   */
  openai: (config: Omit<OpenAIConfig, 'type'> = {}): MastraLLMProvider => 
    new MastraLLMProvider({ type: 'openai', ...config }),
  
  /**
   * Create Cloudflare Workers AI provider
   */
  workersai: (config: Omit<WorkersAIConfig, 'type'> = {}): MastraLLMProvider => 
    new MastraLLMProvider({ type: 'workers-ai', ...config }),
  
  /**
   * Auto-detect provider from environment variables
   */
  auto: (): MastraLLMProvider => {
    // Check for OpenAI credentials
    if (getEnv('OPENAI_API_KEY')) {
      return MastraProviders.openai();
    }

    // Check for Cloudflare Workers AI credentials
    if (getEnv('CLOUDFLARE_ACCOUNT_ID') && 
        getEnv('CLOUDFLARE_GATEWAY_ID') && 
        getEnv('CLOUDFLARE_API_TOKEN')) {
      return MastraProviders.workersai();
    }
    
    throw new Error(
      'No AI provider credentials found in environment variables. ' +
      'Set either OPENAI_API_KEY or CLOUDFLARE_* variables'
    );
  },

  /**
   * Create provider from explicit type with validation
   */
  create: (config: MastraConfig): MastraLLMProvider => {
    return new MastraLLMProvider(config);
  }
} as const;

// Common model constants for better TypeScript experience
export const Models = {
  OpenAI: {
    GPT_4O: 'gpt-4o',
    GPT_4O_MINI: 'gpt-4o-mini',
    GPT_4_TURBO: 'gpt-4-turbo',
    GPT_3_5_TURBO: 'gpt-3.5-turbo'
  },
  WorkersAI: {
    LLAMA_3_1_8B: '@cf/meta/llama-3.1-8b-instruct',
    LLAMA_2_7B: '@cf/meta/llama-2-7b-chat-fp16',
    MISTRAL_7B: '@cf/mistral/mistral-7b-instruct-v0.1',
    PHI_2: '@cf/microsoft/phi-2'
  }
} as const;

// ====== USAGE EXAMPLES ======

/*
// Method 1: Environment variables (recommended)
// .env file:
// CLOUDFLARE_ACCOUNT_ID=your-account-id
// CLOUDFLARE_GATEWAY_ID=your-gateway-id  
// CLOUDFLARE_API_TOKEN=your-api-token

import { Agent } from '@mastra/core/agent';
import { MastraProviders, Models } from './mastra-llm-provider';

const workersProvider = MastraProviders.workersai();

const helloAgent = new Agent({
  name: "workers-ai-agent",
  instructions: "You are powered by Cloudflare Workers AI.",
  model: workersProvider.get()(Models.WorkersAI.LLAMA_3_1_8B)
});

// Method 2: Explicit configuration
const workersProviderExplicit = MastraProviders.workersai({
  accountId: 'your-account-id',
  gatewayId: 'your-gateway-id',
  apiToken: 'your-api-token'
});

const helloAgent2 = new Agent({
  name: "workers-ai-agent-2",
  instructions: "You are powered by Cloudflare Workers AI.",
  model: workersProviderExplicit.get()(Models.WorkersAI.LLAMA_3_1_8B)
});

// Method 3: OpenAI
const openaiProvider = MastraProviders.openai();

const openaiAgent = new Agent({
  name: "openai-agent",
  instructions: "You are powered by OpenAI.",
  model: openaiProvider.get()(Models.OpenAI.GPT_4O_MINI)
});

// Method 4: Auto-detect
const autoProvider = MastraProviders.auto();

const autoAgent = new Agent({
  name: "auto-agent", 
  instructions: "You are powered by the best available AI provider.",
  model: autoProvider.get()(Models.OpenAI.GPT_4O_MINI)
});

// Method 5: Type-safe configuration
const typedProvider = MastraProviders.create({
  type: 'workers-ai',
  accountId: 'your-account-id',
  gatewayId: 'your-gateway-id',
  apiToken: 'your-api-token',
  headers: {
    'Custom-Header': 'value'
  }
});
*/

export default MastraLLMProvider;