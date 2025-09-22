/**
 * Simplified LLM Provider for Mastra Agents
 * Supports OpenAI and Cloudflare Workers AI with context-aware environment access
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// Simple environment accessor for Cloudflare Workers
function getEnv(key: string, env?: any): string | undefined {
  return env?.[key];
}

// Get Cloudflare configuration from context
function getCloudflareConfig(env?: any): {
  accountId: string | undefined;
  gatewayId: string | undefined;
  apiToken: string | undefined;
  isComplete: boolean;
} {
  const accountId = getEnv('CLOUDFLARE_ACCOUNT_ID', env);
  const gatewayId = getEnv('CLOUDFLARE_GATEWAY_ID', env);
  const apiToken = getEnv('CLOUDFLARE_API_TOKEN', env);

  return {
    accountId,
    gatewayId,
    apiToken,
    isComplete: !!(accountId && gatewayId && apiToken)
  };
}

// Type definitions
export type ProviderType = 'openai' | 'workers-ai' | 'cloudflare';

export interface BaseConfig {
  type: ProviderType;
  headers?: Record<string, string>;
  context?: any; // Cloudflare Workers context (c)
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
  private context?: any;

  constructor(config: MastraConfig) {
    this.config = config;
    this.context = config.context;
    this.initialize();
  }

  private initialize(): void {
    const { type, context, ...providerConfig } = this.config;
    
    if (!type) {
      throw new Error('Provider type is required. Use "openai" or "workers-ai"');
    }

    switch (type.toLowerCase()) {
      case 'openai':
        this.provider = this.createOpenAIProvider(providerConfig as Omit<OpenAIConfig, 'type' | 'context'>);
        break;
      case 'workers-ai':
      case 'cloudflare':
        this.provider = this.createWorkersAIProvider(providerConfig as Omit<WorkersAIConfig, 'type' | 'context'>);
        break;
      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }
  }

  private createOpenAIProvider(config: Omit<OpenAIConfig, 'type' | 'context'>): OpenAICompatibleProvider {
    const {
      apiKey = getEnv('OPENAI_API_KEY', this.context?.env),
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
      ...(provider as unknown as Record<string, unknown>)
    } as OpenAICompatibleProvider;
  }

  private createWorkersAIProvider(config: Omit<WorkersAIConfig, 'type' | 'context'>): OpenAICompatibleProvider {
    // Try to get from config first, then fallback to context environment
    const cfConfig = getCloudflareConfig(this.context?.env);
    
    const {
      accountId = cfConfig.accountId,
      gatewayId = cfConfig.gatewayId,
      apiToken = cfConfig.apiToken,
      headers = {}
    } = config;

    if (!accountId || !gatewayId || !apiToken) {
      throw new Error(
        'Cloudflare credentials required: accountId, gatewayId, apiToken. ' +
        'Set environment variables in your Cloudflare Workers or pass in config'
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
   * Update context for environment variable access
   */
  public setContext(context: any): this {
    this.context = context;
    return this;
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
 * Factory functions for easy setup with Cloudflare Workers context support
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
   * Auto-detect provider from context environment variables
   */
  auto: (ctxOrConfig?: any): MastraLLMProvider => {
    // If explicit config object passed, use it
    if (ctxOrConfig && typeof ctxOrConfig === 'object' && 'type' in ctxOrConfig) {
      return MastraProviders.create(ctxOrConfig as MastraConfig);
    }

    // Try to read credentials from a Hono/Cloudflare context or similar
    const maybeEnv = ctxOrConfig && typeof ctxOrConfig === 'object'
      ? (ctxOrConfig.env ?? ctxOrConfig)
      : undefined;

    // Check for OpenAI credentials in provided context/env
    if (maybeEnv && (maybeEnv.OPENAI_API_KEY || maybeEnv.openai_api_key)) {
      return MastraProviders.openai();
    }

    // Check for Cloudflare Workers AI credentials in provided context/env
    if (maybeEnv && (maybeEnv.CLOUDFLARE_ACCOUNT_ID || maybeEnv.CLOUDFLARE_GATEWAY_ID || maybeEnv.CLOUDFLARE_API_TOKEN)) {
      return MastraProviders.workersai();
    }

    // Fallback to process/global env checks
    if (getEnv('OPENAI_API_KEY')) {
      return MastraProviders.openai();
    }

    if (getEnv('CLOUDFLARE_ACCOUNT_ID') && getEnv('CLOUDFLARE_GATEWAY_ID') && getEnv('CLOUDFLARE_API_TOKEN')) {
      return MastraProviders.workersai();
    }

    throw new Error(
      'No AI provider credentials found. Set either OPENAI_API_KEY or CLOUDFLARE_* variables or pass a provider config.'
    );
  },

  /**
   * Create provider from explicit type with validation
   */
  create: (config: MastraConfig): MastraLLMProvider => {
    return new MastraLLMProvider(config);
  },

  /**
   * Create provider from Cloudflare Workers context (convenience method)
   */
  fromContext: (c: any, type: ProviderType = 'workers-ai'): MastraLLMProvider => {
    return new MastraLLMProvider({ type, context: c });
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
// Method 1: From Cloudflare Workers context (NEW - RECOMMENDED)
import { Agent } from '@mastra/core/agent';
import { MastraProviders, Models } from './mastra-llm-provider';

// In your Hono.js route or Cloudflare Workers handler
app.post('/chat', async (c: any) => {
  // Create provider from context
  const provider = MastraProviders.fromContext(c);
  
  const agent = new Agent({
    name: "workers-ai-agent",
    instructions: "You are powered by Cloudflare Workers AI.",
    model: provider.get()(Models.WorkersAI.LLAMA_3_1_8B)
  });

  const response = await agent.text("Hello!");
  return c.json({ response });
});

// Method 2: Auto-detect with context
app.post('/auto-chat', async (c: any) => {
  const provider = MastraProviders.auto(c);
  
  const agent = new Agent({
    name: "auto-agent",
    instructions: "You are powered by the best available AI provider.",
    model: provider.get()(Models.WorkersAI.LLAMA_3_1_8B)
  });

  const response = await agent.text("Hello!");
  return c.json({ response });
});

// Method 3: Explicit configuration with context
app.post('/explicit-chat', async (c: any) => {
  const provider = MastraProviders.workersai({ 
    context: c,
    // Optional: override specific values
    headers: {
      'Custom-Header': 'my-value'
    }
  });
  
  const agent = new Agent({
    name: "explicit-agent",
    instructions: "You are configured explicitly.",
    model: provider.get()(Models.WorkersAI.MISTRAL_7B)
  });

  const response = await agent.text("Hello!");
  return c.json({ response });
});

// Method 4: Update context dynamically
const provider = MastraProviders.workersai();

app.post('/dynamic-chat', async (c: any) => {
  // Update context for this request
  provider.setContext(c);
  
  const agent = new Agent({
    name: "dynamic-agent",
    instructions: "You are dynamically configured.",
    model: provider.get()(Models.WorkersAI.LLAMA_3_1_8B)
  });

  const response = await agent.text("Hello!");
  return c.json({ response });
});

// Method 5: OpenAI with context
app.post('/openai-chat', async (c: any) => {
  const provider = MastraProviders.openai({ context: c });
  
  const agent = new Agent({
    name: "openai-agent",
    instructions: "You are powered by OpenAI.",
    model: provider.get()(Models.OpenAI.GPT_4O_MINI)
  });

  const response = await agent.text("Hello!");
  return c.json({ response });
});

// Method 6: Environment validation
app.get('/check-env', async (c: any) => {
  try {
    const provider = MastraProviders.auto(c);
    return c.json({ 
      status: 'ready', 
      info: provider.getInfo() 
    });
  } catch (error) {
    return c.json({ 
      status: 'error', 
      message: error.message 
    }, 400);
  }
});
*/

export default MastraLLMProvider;