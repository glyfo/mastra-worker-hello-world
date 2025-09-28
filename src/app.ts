import { Hono } from 'hono';
import { health } from '@routes/health';
import { wonka } from '@routes/wonka';
import type { AppCtx } from './type';

const app = new Hono<AppCtx>();

app.use('*', async (c, next) => {
	const traceId = crypto.randomUUID();
	c.set('traceId', traceId); // ✅ typed ok
	await next();
});

app.post('/health', health);
app.post('/wonka', wonka);

export default app;
