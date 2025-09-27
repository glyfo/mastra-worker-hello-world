import { createAiGateway } from 'ai-gateway-provider';
import { workersAiModel } from './workers-ai-adapter';

export function makeGatewayWorkersAI(env: { CF_ACCOUNT_ID: string; CF_GATEWAY: string; CF_API_TOKEN: string }) {
	const aigateway = createAiGateway({
		accountId: env.CF_ACCOUNT_ID,
		gateway: env.CF_GATEWAY,
		apiKey: env.CF_API_TOKEN,
	});

	// Expose Workers AI via Gateway (OpenAI-compatible)
	return () => aigateway([workersAiModel(env, '@cf/meta/llama-3.1-8b-instruct')]);
}
