// support-agent.ts
import { Agent } from '@mastra/core';
import type { Context } from 'hono';
import { makeWorkersAIDynamicModel } from '@providers/workersai';
import { trace } from '@utils/trace'; // <- your tiny logger

export function makeSupportAgent(c: Context) {
	trace('makeSupportAgent: start');

	// Pull env off Hono context (Workers style)
	const env = (c as any)?.env ?? {};
	trace('makeSupportAgent: env detected', {
		hasAI: !!env.AI,
		keys: Object.keys(env || {}),
	});

	// Create the model via your gateway provider
	const model = makeWorkersAIDynamicModel(env);
	trace('makeSupportAgent: model created', {
		type: typeof model,
		keys: model && typeof model === 'object' ? Object.keys(model) : undefined,
	});

	// Instantiate the agent
	const agent = new Agent({
		name: 'support',
		instructions: 'Be concise and helpful.',
		model,
	});

	trace('makeSupportAgent: agent instantiated', { name: 'support' });

	return agent;
}
