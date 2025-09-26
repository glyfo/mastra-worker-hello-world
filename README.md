# Mastra Worker — Hello World

Minimal **Cloudflare Workers + Hono** API wired to **Mastra agents** (Workers AI or OpenAI), routed through **Cloudflare AI Gateway**. Fast local dev with Wrangler; one‑command deploy.

---

## Quick Start

```bash
pnpm i
pnpm dev        # http://127.0.0.1:8787
```

**Test**

```bash
curl -s http://127.0.0.1:8787/
curl -s -X POST http://127.0.0.1:8787/hello -H 'content-type: application/json' -d '{"name":"Ada"}'
```

---

## Cloudflare AI Gateway (used by default)

- All Workers‑AI calls are proxied via **AI Gateway** for analytics, caching, and key protection.
- Set your Account + **Gateway ID** in `.dev.vars` and in the Worker’s production variables.
- Our provider helper reads these and points the Mastra agent at the Gateway endpoint.

```ini
# .dev.vars
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_GATEWAY_ID=xxx   # AI Gateway -> Gateway ID
CLOUDFLARE_API_TOKEN=xxx    # token with AI Gateway access
```

> If you switch providers, the Mastra agent will still route Workers‑AI traffic through the Gateway automatically when the env vars above are present.

---

## Env Vars (`.dev.vars`)

```ini
# Workers AI (via AI Gateway)
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_GATEWAY_ID=xxx
CLOUDFLARE_API_TOKEN=xxx

# OpenAI (optional)
OPENAI_API_KEY=sk-...

# Email (optional)
RESEND_API_KEY=re_...
```

---

## Structure

```
src/
  app.ts               # Hono app + routes
  index.ts             # export default app.fetch
  routes/
    health.ts          # GET /
    hello.ts           # POST /hello { name }
  agents/
    helloAgent.ts      # Mastra agent factory
    index.ts           # export { helloAgent } from "./helloAgent"
  lib/
    agent.ts           # createMastraAgent()
  providers/
    index.ts           # MastraProviders, Models
```

---

## Endpoints

- **GET /** → `{ status, timestamp, cf_ray }`
- **POST /hello** `{ name }` → `{ greeting, name }`

---

## Key Snippets

**`src/agents/helloAgent.ts`**

```ts
import type { Context } from 'hono';
import { MastraAgent } from '@/lib/agent';
import { Models } from '@/providers';

export function helloAgent(c: Context) {
	return new MastraAgent(c, {
		provider: 'workers-ai', // routed via Cloudflare AI Gateway when env vars are set
		model: Models.WorkersAI.LLAMA_3_1_8B,
		name: 'hello-agent',
		instructions: "You are a friendly greeter. Always respond with enthusiasm and include the person's name.",
	});
}
```

**`src/routes/hello.ts`**

```ts
import type { Context } from 'hono';
import { helloAgent } from '@/agents';

export async function hello(c: Context) {
	const body = await c.req.json().catch(() => ({} as { name?: string }));
	const name = body.name ?? 'World';
	const agent = helloAgent(c);
	const greeting = await agent.generateVNext(`Say hello to ${name}`);
	return c.json({ greeting, name });
}
```

**`src/app.ts`**

```ts
import { Hono } from 'hono';
import { health } from '@/routes/health';
import { hello } from '@/routes/hello';

export const app = new Hono();
app.get('/', health);
app.post('/hello', hello);
```

**`src/index.ts`**

```ts
import { app } from './app';
export default app.fetch;
```

---

## Deploy

```bash
wrangler deploy
```

> Ensure production variables are set in Cloudflare → Workers → **Settings → Variables** (including `CLOUDFLARE_GATEWAY_ID`).

---

## Troubleshooting

- **401/403 (Workers AI)**: check `CLOUDFLARE_*` vars and AI Gateway permissions.
- **TS2307**: verify path aliases & `src/agents/index.ts`.
- **Blank Worker**: ensure `export default app.fetch`.
