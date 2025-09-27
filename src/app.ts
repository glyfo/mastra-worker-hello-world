import { Hono } from 'hono';
import { health } from '@routes/health';
import { support } from '@routes/support';

const app = new Hono();

app.post('/health', health);
app.post('/support', support);

export default app;
