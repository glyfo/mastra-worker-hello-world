# Mastra Worker — Hello World

A minimal **Cloudflare Workers + Hono** API that wires **Mastra agents** to either **Cloudflare Workers AI** or **OpenAI**. Run it locally with Wrangler, then deploy in seconds.

---

## Features

- ⚙️ Provider helpers (Workers AI / OpenAI / auto-detect)
- 🤖 Tiny `createMastraAgent()` utility
- 🌐 Hono routes (`/` health, `/hello` demo)
- 🧱 Clean file layout & copy-paste cURL tests

src/
app.ts
index.ts # export default app.fetch (Workers)
routes/
health.ts
hello.ts
lib/
trace.ts # tiny logger
agent.ts # createMastraAgent()
providers/ # your MastraProviders + Models

yaml
Copy code

> If the repo includes a local dev `Agent` shim, swap it to the real **`@mastra/core`** in production.

---

## Prerequisites

- Node 18+
- Wrangler (`npm i -g wrangler`)
- pnpm (or npm/yarn)

---

## Environment

Create a `.dev.vars` at the repo root (used by `wrangler dev`) **or** export these as env vars.

**Workers AI (recommended)**

```ini
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_GATEWAY_ID=your_gateway_id
CLOUDFLARE_API_TOKEN=your_api_token
OpenAI (optional)

ini
Copy code
OPENAI_API_KEY=sk-...
If you also test email, add:

ini
Copy code
RESEND_API_KEY=re_...
Install & Run
bash
Copy code
pnpm install
pnpm dev           # wrangler dev; http://127.0.0.1:8787
API
1) Health
pgsql
Copy code
GET /
→ 200 { status, timestamp, cf_ray }
2) Hello (demo agent)
css
Copy code
POST /hello
Body: { "name": "Ada" }
→ 200 { greeting, name }
cURL Quickstart
bash
Copy code
# Health
curl -s http://127.0.0.1:8787/

# Hello demo
curl -s -X POST http://127.0.0.1:8787/hello \
  -H 'content-type: application/json' \
  -d '{"name":"Lily"}'
Using Mastra Providers (snippets)
Adjust imports to match your providers/ module and the real Mastra SDK package name.

ts
Copy code
import { Agent } from '@mastra/core';
import { MastraProviders, Models } from './providers';

/** Workers AI (env-based) */
const cf = MastraProviders.cloudflare();
const cfAgent = new Agent({
  name: 'cf-agent',
  instructions: 'Powered by Cloudflare Workers AI.',
  model: cf.get()('@cf/meta/llama-3.1-8b-instruct'),
});

/** Workers AI (explicit config) */
const cfExplicit = MastraProviders.cloudflare({
  accountId: 'your-account-id',
  gatewayId: 'your-gateway-id',
  apiToken: 'your-api-token',
});
const cfAgent2 = new Agent({
  name: 'cf-agent-2',
  instructions: 'Explicit config.',
  model: cfExplicit.get()('@cf/meta/llama-3.1-8b-instruct'),
});

/** OpenAI */
const openai = MastraProviders.openai();
const openaiAgent = new Agent({
  name: 'openai-agent',
  instructions: 'Powered by OpenAI.',
  model: openai.get()('gpt-4o-mini'),
});

/** Auto-detect */
const auto = MastraProviders.auto();
const autoAgent = new Agent({
  name: 'auto-agent',
  instructions: 'Pick the best available provider.',
  model: auto.get()(Models.WorkersAI.LLAMA_3_1_8B),
});
Deploy
bash
Copy code
wrangler deploy
Ensure your production environment variables are configured in Cloudflare (Dashboard → Workers → Settings → Variables).

Troubleshooting
401/403 from Workers AI → check CLOUDFLARE_* values and Gateway access.

“fetch failed” → confirm wrangler whoami and account id; retry wrangler dev.

Type errors for Agent → install the correct Mastra package and update the import path.

CORS (browser clients) → add Hono CORS middleware.

Nothing responds → confirm index.ts exports default app.fetch.

License
MIT — use freely for prototypes and demos.
```
