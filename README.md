# 🍫 Mastra Worker Hello World

This project demonstrates how to build and deploy an **AI-powered Worker** on Cloudflare using [Mastra](https://github.com/glyfo/mastra), [AI SDK v5](https://sdk.vercel.ai/docs), and [Workers AI].

## 🚀 Features

- ⚡️ Cloudflare Workers runtime
- 🤖 Agent framework powered by `@mastra/core`
- 🎩 **Wonka Agent** – a whimsical, candy-themed AI personality
- 🌐 REST-style routes using `hono`

---

## 📂 Project Structure

```
src/
 ├─ mastra/
 │   ├─ agents/
 │   │   └─ wonka-agent.ts   # Defines Willy Wonka agent
 │   └─ providers/           # Workers AI provider
 ├─ routes/
 │   ├─ health.ts            # Health check route
 │   └─ wonka.ts             # Wonka API route
 ├─ app.ts                   # Hono app entry
 └─ index.ts                 # Worker entry
```

---

## 🧑‍💻 Installation

```bash
pnpm install
```

Environment variables are defined in `.dev.vars` and bound automatically with Wrangler.

---

## 🔑 Environment Variables

| Variable                | Description               |
| ----------------------- | ------------------------- |
| `OPENAI_API_KEY`        | OpenAI key for LLM access |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID     |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare API token      |
| `CLOUDFLARE_GATEWAY_ID` | Cloudflare AI Gateway ID  |
| `AI`                    | Workers AI binding        |

---

## 🎩 Wonka Agent

The Wonka Agent is a playful AI personality:

```ts
const agent = new Agent({
	name: 'wonka-agent',
	description: 'Willy Wonka—whimsical, kind, candy-themed (text only).',
	instructions:
		'Write as Willy Wonka: whimsical, kind, candy-themed. Keep it to 1–3 sentences, family-friendly, and include one light confectionery metaphor.',
	model,
});
```

---

## 🌐 Routes

### Health

```http
GET /health
```

Returns service status.

### Wonka

```http
POST /wonka
Content-Type: application/json

{
  "message": "Tell me a secret"
}
```

✅ Response:

```json
{
	"reply": "Ah, a secret! Like a truffle hidden in golden foil, some wonders are sweeter when unwrapped with patience.",
	"message": "Tell me a secret"
}
```

---

## 📦 Dependencies

```json
"dependencies": {
  "@ai-sdk/openai": "^2.0.42",
  "@mastra/core": "^0.19.1",
  "@mastra/deployer-cloudflare": "^0.14.4",
  "ai": "^5.0.59",
  "ai-gateway-provider": "^2.0.0",
  "hono": "^4.9.9",
  "workers-ai-provider": "^2.0.0"
}
```

---

## 🛠 Development

Start local dev server:

```bash
pnpm dev
```

Access routes:

- `http://localhost:8787/health`
- `http://localhost:8787/wonka`

---

## ☁️ Deployment

Deploy with Wrangler:

```bash
pnpm wrangler deploy
```

---

## ⚠️ Known Issues

- **Workers AI Gateway limitation**  
  If you see the following error:

  ```
  Sorry, but provider "workersai.chat" is currently not supported. Please open an issue.
  ```

  This happens when trying to use the **AI Gateway** with `workersai.chat`.  
  ✅ Workaround: Use `workersai` directly instead of `workersai.chat`, or configure a different supported provider.
