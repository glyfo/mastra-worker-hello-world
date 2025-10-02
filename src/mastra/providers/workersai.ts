// models/workers-ai.ts
import { createWorkersAI } from 'workers-ai-provider';

type Env = { AI: Ai };

export function makeGatewayWorkersAI(env: Env) {
	const workersai = createWorkersAI({ binding: env.AI });

	// Mastra expects: ({ runtimeContext, mastra }) => Model
	return function _mastraModel(_args: { runtimeContext: unknown; mastra?: unknown }) {
		return workersai('@cf/meta/llama-3.2-3b-instruct', {
			safePrompt: true,
		});
	};
}
