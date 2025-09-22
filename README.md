# Mastra Worker Hello World

A minimal Cloudflare Workers + Mastra example that exposes a small Hono-based API to create and interact with AI agents.

This repository is intended as a local development starter demonstrating how to:

- create a provider (OpenAI or Cloudflare Workers AI),
- create lightweight agents wired to a provider,
- expose a small HTTP API using Hono to create agents and generate text.

> Note: the repository contains a small local `Agent` shim used for development. Replace it with `@mastra/core` when integrating with the production library.

## Prerequisites

- Wrangler CLI (for Cloudflare Workers): `npm install -g wrangler`

## Environment Variables

Create `.dev.vars` or export the following variables depending on which provider you use.

For Cloudflare Workers AI (recommended during local dev with the gateway):

```
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_GATEWAY_ID=your_gateway_id
CLOUDFLARE_API_TOKEN=your_api_token
```

For OpenAI (alternative):

```
OPENAI_API_KEY=sk_...
```

## Install

Install dependencies:

```bash
npm install
```

## Run locally with Wrangler

Start the worker in development mode:

```bash
pnpm dev
```

By default Wrangler serves at `http://127.0.0.1:8787`.

## API Reference

1. Create an agent

POST /agent

Optional JSON body fields:

- `id` — string agent id (defaults to generated id)
- `name` — human-friendly name
- `instructions` — agent instructions
- `model` — model identifier (e.g. `@cf/meta/llama-3.1-8b-instruct`)
- `config` — provider config object for explicit provider creation

Example:

```bash
curl -X POST http://127.0.0.1:8787/agent \
  -H "Content-Type: application/json" \
  -d '{"id":"lily","name":"Lily","instructions":"You are Lily the assistant.","model":"@cf/meta/llama-3.1-8b-instruct"}'
```

2. Generate text from an agent

POST /agent/:id/generate

JSON body:

- `prompt` — the prompt to send to the agent

Example:

```bash
curl -X POST http://127.0.0.1:8787/agent/lily/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Write a friendly welcome message for a new user."}'
```

## Notes & Next Steps

- The code currently uses a simple local `Agent` shim at `src/mastra/Agent.ts` that echoes prompts. For real behavior, replace it with the `@mastra/core` agent and ensure the package is installed.
- `wrangler.toml` points to `src/app.ts` as the Worker entry.
- Consider adding authentication and persistence for created agents for production use.

If you'd like, I can:

- wire the real `@mastra/core` Agent and provider calls,
- add a Node `server.ts` for running locally without Wrangler,
- add validation, rate-limiting, or persistence for agents.

# Resend Email Worker

// ====== USAGE WITH MASTRA AGENTS ======

// Method 1: Environment variables (recommended)
// .env file:
// CLOUDFLARE_ACCOUNT_ID=your-account-id
// CLOUDFLARE_GATEWAY_ID=your-gateway-id  
// CLOUDFLARE_API_TOKEN=your-api-token

## Running the Worker and Interacting with Agents

This project exposes a small Hono-based API for creating and interacting with Mastra agents.

Start the worker locally with Wrangler:

```bash
wrangler dev
```

Endpoints

- `POST /agent` - create an agent. JSON body (optional): `{ "id": "my-agent", "name": "lily", "instructions": "You are helpful.", "model": "@cf/meta/llama-3.1-8b-instruct" }`
- `POST /agent/:id/generate` - generate text from an agent. JSON body: `{ "prompt": "Hello" }`

Example curl calls

# Create an agent (auto provider or pass explicit config)

curl -X POST http://127.0.0.1:8787/agent \
 -H "Content-Type: application/json" \
 -d '{"id":"lily","name":"Lily","instructions":"You are Lily the assistant.", "model":"@cf/meta/llama-3.1-8b-instruct"}'

# Generate text from the agent

curl -X POST http://127.0.0.1:8787/agent/lily/generate \
 -H "Content-Type: application/json" \
 -d '{"prompt":"Write a friendly hello message for a new user."}'

Notes

- When running with `wrangler dev`, the default host/port is `http://127.0.0.1:8787`.
- Ensure environment variables are set (Cloudflare or OpenAI credentials) for the provider you want to use.

const workersProvider = MastraProviders.workersai();

const helloAgent = new Agent({
name: "workers-ai-agent",
instructions: "You are powered by Cloudflare Workers AI.",
model: workersProvider.get()("@cf/meta/llama-3.1-8b-instruct")
});

// Method 2: Explicit configuration
const workersProviderExplicit = MastraProviders.workersai({
accountId: 'your-account-id',
gatewayId: 'your-gateway-id',
apiToken: 'your-api-token'
});

const helloAgent2 = new Agent({
name: "workers-ai-agent-2",
instructions: "You are powered by Cloudflare Workers AI.",
model: workersProviderExplicit.get()("@cf/meta/llama-3.1-8b-instruct")
});

// Method 3: OpenAI
const openaiProvider = MastraProviders.openai();

const openaiAgent = new Agent({
name: "openai-agent",
instructions: "You are powered by OpenAI.",
model: openaiProvider.get()("gpt-4o-mini")
});

// Method 4: Auto-detect
const autoProvider = MastraProviders.auto();

const autoAgent = new Agent({
name: "auto-agent",
instructions: "You are powered by the best available AI provider.",
model: autoProvider.get()("gpt-4o-mini") // or "@cf/meta/llama-3.1-8b-instruct"
});

// Method 5: Multiple agents with different models
const provider = MastraProviders.workersai();

const agents = [
new Agent({
name: "llama-agent",
instructions: "You are a Llama model.",
model: provider.get()("@cf/meta/llama-3.1-8b-instruct")
}),
new Agent({
name: "mistral-agent",
instructions: "You are a Mistral model.",
model: provider.get()("@cf/mistral/mistral-7b-instruct-v0.1")
})
];
