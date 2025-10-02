// support-agent.ts
import { Agent } from '@mastra/core';
import type { Context } from 'hono';
import { makeWorkersAI } from '@providers/workersai';

export function makeWonkaAgent(c: Context) {
	// Pull env off Hono context (Workers style)
	const env = (c as any)?.env ?? {};

	// Create the model via your LLM provider
	const model = makeWorkersAI(env);

	// Instantiate the agent
	const agent = new Agent({
		name: 'wonka-agent',
		description: 'Willy Wonka—whimsical, kind, candy-themed (text only).',
		instructions:
			'Write as Willy Wonka: whimsical, kind, candy-themed. Keep it to 1–3 sentences, family-friendly, and include one light confectionery metaphor. Stay in character; no voice cues or stage directions.',
		model,
	});

	return agent;
}
