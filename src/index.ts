import { Agent } from '@mastra/core/agent';
import { MastraProviders, Models, type MastraConfig } from './providers';

// Method 1: Auto-detection (simplest)
const autoProvider = MastraProviders.auto();
const agent = new Agent({
  name: "auto-agent",
  instructions: "You are an AI assistant.",
  model: autoProvider.get()(Models.WorkersAI.LLAMA_3_1_8B)
});

// Method 2: Type-safe explicit config
const config: MastraConfig = {
  type: 'workers-ai',
  accountId: 'your-account-id',
  gatewayId: 'your-gateway-id',
  apiToken: 'your-api-token'
};

const provider = MastraProviders.create(config);