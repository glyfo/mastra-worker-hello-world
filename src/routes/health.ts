import type { Context } from 'hono';
import { trace } from '@utils/trace';

export const health = (c: Context) => {
	const ip = c.req.header('cf-connecting-ip') ?? 'unknown';
	const cfRay = c.req.header('cf-ray') ?? 'unknown';
	const now = new Date().toISOString();

	trace(`Health check from ${ip} at ${now}`);

	return c.json({
		status: 'ok',
		timestamp: now,
		cf_ray: cfRay,
	});
};
