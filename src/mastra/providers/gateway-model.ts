import { createAiGateway } from 'ai-gateway-provider';
import { createWorkersAI } from 'workers-ai-provider';

type Env = {
	AI: any;
	CLOUDFLARE_ACCOUNT_ID: string;
	CLOUDFLARE_GATEWAY_ID: string;
};

// Minimal AiGateway creator (single route to Workers AI)
export function makeGatewayWorkersAI(env: Env) {
	return createAiGateway({
		accountId: env.CLOUDFLARE_ACCOUNT_ID,
		gateway: env.CLOUDFLARE_GATEWAY_ID,
	});
}

// Mastra factory: returns a function that yields a Model instance
export function makeGatewayModel(env: Env) {
	const workersai = createWorkersAI({ binding: env.AI });
	const aigateway = makeGatewayWorkersAI(env);

	const model = aigateway([workersai('@cf/meta/llama-3.2-3b-instruct', { safePrompt: true })]);

	return function _mastraModel() {
		return model;
	};
}
