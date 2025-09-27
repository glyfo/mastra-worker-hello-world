import { createAiGateway } from 'ai-gateway-provider';
import { createWorkersAI } from 'workers-ai-provider';

type Env = {
	AI: any; // Workers AI binding from wrangler.toml [ai]
	CF_ACCOUNT_ID: string; // Cloudflare account id (optional)
	CF_GATEWAY: string; // AI Gateway name (optional)
	CF_API_TOKEN: string; // Gateway API token if auth enabled (optional)
};

export function makeGatewayWorkersAI(env: Env) {
	const aigateway = createAiGateway({
		accountId: env.CF_ACCOUNT_ID,
		gateway: env.CF_GATEWAY,
		apiKey: env.CF_API_TOKEN,
	});

	// Expose Workers AI via Gateway (OpenAI-compatible)
	const workersai = createWorkersAI({ binding: env.AI });

	return () => aigateway([workersai('@cf/meta/llama-3.2-3b-instruct')]);
}
