import { Hono } from 'hono';
import type { Context } from 'hono';
import Agent from './mastra/Agent';
import { MastraProviders, Models } from './providers';

// Helper: create an agent using autodetected provider (or explicit config)
async function createMastraAgent(c: Context, opts: { name?: string; instructions?: string; model?: string } = {}) {
  const provider = MastraProviders.auto(c);
  const model = opts.model || Models.WorkersAI.LLAMA_3_1_8B;

  return new Agent({
    name: opts.name || 'agent',
    instructions: opts.instructions || 'You are a helpful AI assistant.',
    model: provider.get()(model)
  });
}

const app = new Hono();

// Simple health check
app.get('/', (c) => c.json({ status: 'ok' }));


// POST /hello - greeting endpoint
app.post('/hello', async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const name = body.name || 'World';

  try {
    const agent = await createMastraAgent(c, {
      name: 'hello-agent',
      instructions: `You are a friendly greeter. Always respond with enthusiasm and include the person's name.`,
      model: Models.WorkersAI.LLAMA_3_1_8B
    });

    const response = await agent.generate(`Say hello to ${name}`);
    return c.json({ greeting: response.text, name });
  } catch (err: any) {
    return c.json({ error: err?.message || String(err) }, 500);
  }
});

export default app;