import type { Context } from 'hono';
import { makeSupportAgent } from '@agents/support-agent';
import { trace } from '@utils/trace';

export async function support(c: Context) {
	const body = await c.req.json().catch(() => ({} as { message?: string }));
	const message = body.message ?? 'Hello, can you assist me?';
	trace('support: start');

	const agent = makeSupportAgent(c);

	trace('support: end');

	try {
		const reply = await agent.generateVNext(message);
		return c.json({ reply, message });
	} catch (err: any) {
		return c.json({ error: err?.message ?? 'Support agent failed' }, 500);
	}
}
