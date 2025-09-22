import { Hono } from 'hono';
import type { Context } from 'hono';
import Agent from './mastra/Agent';
import { MastraProviders, Models } from './providers';

// Simple trace helper that integrates with Hono context logs when available
function trace(msg: string, data?: any) {
  const prefix = '[App]';
  console.log(prefix, msg, data);
}

// Helper: create an agent using autodetected provider (or explicit config)
async function createMastraAgent(c: Context, opts: { name?: string; instructions?: string; model?: string } = {}) {
  trace('createMastraAgent: starting', { opts });
  const provider = MastraProviders.auto(c);
  const model = opts.model || Models.WorkersAI.LLAMA_3_1_8B;

  const agent = new Agent({
    name: opts.name || 'agent',
    instructions: opts.instructions || 'You are a helpful AI assistant.',
    model: provider.get()(model)
  });

  trace('createMastraAgent: created agent', { name: agent.name }, c);
  return agent;
}

const app = new Hono();

// Simple health check
app.get('/', (c) => c.json({ status: 'ok' }));


// POST /hello - greeting endpoint
app.post('/hello', async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const name = body.name || 'World';

  try {
    trace('POST /hello: request received', { name });
    const agent = await createMastraAgent(c, {
      name: 'hello-agent',
      instructions: `You are a friendly greeter. Always respond with enthusiasm and include the person's name.`,
      model: Models.WorkersAI.LLAMA_3_1_8B
    });

    const response = await agent.generate(`Say hello to ${name}`);
    trace('POST /hello: got agent response', { text: response.text });
    return c.json({ greeting: response.text, name });
  } catch (err: any) {
    trace('POST /hello: error', { message: err?.message || String(err) });
    return c.json({ error: err?.message || String(err) }, 500);
  }
});

export default app;