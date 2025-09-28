import { createAiGateway } from 'ai-gateway-provider';
//import { createWorkersAI } from 'workers-ai-provider';
import { createOpenAI } from '@ai-sdk/openai';
//import { streamText, type CoreMessage } from 'ai';

type Env = {
	AI: any; // Workers AI binding from wrangler.toml [ai]
	CLOUDFLARE_ACCOUNT_ID: string; // Cloudflare account id (optional)
	CLOUDFLARE_GATEWAY_ID: string; // AI Gateway name (optional)
	CLOUDFLARE_API_TOKEN: string; // Gateway API token if auth enabled (optional)
};

export function makeGatewayWorkersAI(env: Env) {
	const aigateway = createAiGateway({
		accountId: env.CLOUDFLARE_ACCOUNT_ID,
		gateway: env.CLOUDFLARE_GATEWAY_ID,
		apiKey: env.CLOUDFLARE_API_TOKEN,
	});

	// Expose Workers AI via Gateway (OpenAI-compatible)
	//const workersai = createWorkersAI({ binding: env.AI });
	const baseURL = `https://gateway.ai.cloudflare.com/v1/` + `${env.CLOUDFLARE_ACCOUNT_ID}/` + `${env.CLOUDFLARE_GATEWAY_ID}/workers-ai/v1`; // <- important suffix

	const openai = createOpenAI({
		apiKey: env.CLOUDFLARE_API_TOKEN,
		baseURL, // OpenAI-compatible Workers AI gateway
	});

	return () => openai.chat('@cf/meta/llama-3.2-3b-instruct');

	//return () => openai.chat('@cf/meta/llama-3.2-3b-instruct');
	// ✅ Use the chat flavor to hit /v1/chat/completions
	// Chat flavor ensures /v1/chat/completions is used
	//const model = openai.chat('workers-ai/@cf/meta/llama-3.2-3b-instruct');

	//return {
	//	async streamPrompt(prompt: string) {
	//		const result = await streamText({ model, prompt });
	//		return result.toTextStreamResponse();
	//	},
	//	async streamMessages(messages: CoreMessage[]) {
	//		const result = await streamText({ model, messages });
	//		return result.toTextStreamResponse();
	//	},
	//};
}
