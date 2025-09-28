import { Hono } from 'hono';
import { health } from '@routes/health';
import { support } from '@routes/support';
import type { AppCtx } from '@/types';

const app = new Hono<AppCtx>();

app.use('*', async (c, next) => {
	const traceId = crypto.randomUUID();
	c.set('traceId', traceId); // ✅ typed ok
	await next();
});

app.post('/health', health);
app.post('/support', support);

export default app;
