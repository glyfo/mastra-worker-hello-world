import type { Context } from 'hono';
import { makeWonkaAgent } from '@agents/wonka-agent';

export async function wonka(c: Context) {
	const body = await c.req.json().catch(() => ({} as { message?: string }));
	const message = body.message ?? 'Hello, who are you?';

	const agent = makeWonkaAgent(c);

	try {
		const reply = await agent.generateVNext(message);
		return c.json({ reply, message });
	} catch (err: any) {
		return c.json({ error: err?.message ?? 'Wonka is making chocolate' }, 500);
	}
}
