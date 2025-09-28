import { createWorkersAI } from 'workers-ai-provider';
import type { LanguageModel } from 'ai';

type Env = { AI: Ai };

export function getWorkersAIModel(env: Env): () => LanguageModel {
	const workersai = createWorkersAI({ binding: env.AI });

	// Return a function that yields the model instance when called
	return () =>
		workersai('@cf/meta/llama-3.2-3b-instruct', {
			// optional tweaks
			safePrompt: true,
		});
}
