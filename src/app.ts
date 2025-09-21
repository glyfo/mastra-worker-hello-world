import { Hono } from 'hono';
import type { Context } from 'hono';
import Agent from './mastra/Agent';
import { MastraProviders, Models, type MastraConfig } from './providers';

type AgentRecord = {
  id: string;
  agent: Agent;
  provider: ReturnType<typeof MastraProviders.create> | ReturnType<typeof MastraProviders.auto>;
};

const agents = new Map<string, AgentRecord>();

const app = new Hono();

app.get('/', (c) => c.json({ status: 'ok', version: '0.1.0' }));

app.post('/agent', async (c: Context) => {
  const body = await c.req.json().catch(() => ({}));
  const id = body.id || `agent-${Date.now()}`;
  const name = body.name || id;
  const instructions = body.instructions || 'You are an AI assistant.';

  // Create provider (auto or explicit)
  let provider: ReturnType<typeof MastraProviders.create> | ReturnType<typeof MastraProviders.auto>;
  if (body.config) {
    provider = MastraProviders.create(body.config as MastraConfig);
  } else {
    provider = MastraProviders.auto();
  }

  const modelValue = body.model || Models.WorkersAI.LLAMA_3_1_8B;
  const _providerModel = provider.get()(modelValue).model || modelValue;

  const agent = new Agent({
    name,
    instructions,
    model: [ { model: _providerModel as unknown as any } ]
  });

  agents.set(id, { id, agent, provider });

  return c.json({ id, name, ready: true });
});

app.post('/agent/:id/generate', async (c: Context) => {
  const id = c.req.param('id');
  const record = agents.get(id);
  if (!record) return c.json({ error: 'Agent not found' }, 404);

  const body = await c.req.json().catch(() => ({}));
  const prompt = body.prompt || 'Hello from agent!';

  try {
    const res = await record.agent.generate(prompt);
    return c.json({ text: res.text });
  } catch (err) {
    console.error('agent generate error', err);
    return c.json({ error: 'generate failed' }, 500);
  }
});

export default app;
