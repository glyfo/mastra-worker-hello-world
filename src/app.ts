import { Hono } from 'hono';
import type { Context } from 'hono';
import Agent from './mastra/Agent';
import { MastraProviders, Models } from './providers';

// Helper: create an agent using autodetected provider (or explicit config)
async function createAgent(c: Context, opts: { name?: string; instructions?: string; model?: string } = {}) {
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


// POST /chat - quick chat with an auto agent
app.post('/chat', async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const prompt = body.prompt || body.message || 'Hello!';
  const model = body.model;

  try {
    const agent = await createAgent(c, { model });
    const response = await agent.generate(prompt);
    return c.json({ response: response.text });
  } catch (err: any) {
    return c.json({ error: err?.message || String(err) }, 500);
  }
});

// POST /hello - greeting endpoint
app.post('/hello', async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const name = body.name || 'World';

  try {
    const agent = await createAgent(c, {
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

// GET /env-check - quick provider readiness check
app.get('/env-check', (c: Context) => {
  try {
    const provider = MastraProviders.auto(c);
    return c.json({ status: 'ready', provider: provider.getInfo() });
  } catch (err: any) {
    return c.json({ status: 'not configured', error: err?.message }, 400);
  }
});

// POST /custom-chat - custom instructions and model
app.post('/custom-chat', async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const { prompt = 'Hello!', instructions, model, name } = body;

  try {
    const agent = await createAgent(c, { name, instructions, model });
    const response = await agent.generate(prompt);
    return c.json({ response: response.text });
  } catch (err: any) {
    return c.json({ error: err?.message || String(err) }, 500);
  }
});

export default app;

// ====== USAGE EXAMPLES ======

/*
// 1. Simple chat
POST /chat
{
  "prompt": "What is the weather like?"
}

// 2. Hello world
POST /hello  
{
  "name": "Alice"
}

// 3. Custom chat with instructions
POST /custom-chat
{
  "prompt": "Explain quantum computing",
  "instructions": "You are a quantum physics professor. Explain complex topics simply.",
  "model": "@cf/meta/llama-3.1-8b-instruct",
  "name": "physics-tutor"
}

// 4. Environment check
GET /env-check

// Environment Variables needed:
// CLOUDFLARE_ACCOUNT_ID=your-account-id
// CLOUDFLARE_GATEWAY_ID=your-gateway-id  
// CLOUDFLARE_API_TOKEN=your-api-token
//
// OR
//
// OPENAI_API_KEY=sk-your-openai-key
*/