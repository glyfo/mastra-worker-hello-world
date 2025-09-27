import { createAiGateway } from 'ai-gateway-provider';
import { createWorkersAI } from 'workers-ai-provider';

type Env = {
	AI: any; // <- REQUIRED: Workers AI binding from wrangler.toml [ai]
	CF_ACCOUNT_ID?: string; // optional: Gateway account id
	CF_GATEWAY?: string; // optional: Gateway name
	CF_API_TOKEN?: string; // optional: Gateway API token (if auth enabled)
};

export function makeGatewayWorkersAI(env: { CF_ACCOUNT_ID: string; CF_GATEWAY: string; CF_API_TOKEN: string }) {
	const aigateway = createAiGateway({
		accountId: env.CF_ACCOUNT_ID,
		gateway: env.CF_GATEWAY,
		apiKey: env.CF_API_TOKEN,
	});

	// Expose Workers AI via Gateway (OpenAI-compatible)
	const workersai = createWorkersAI({ binding: env.AI });

	return () => aigateway([workersai('@cf/meta/llama-2-7b-chat-int8')]);
}
