// src/lib/agent.ts Experimental v5 Agent wrapper for Mastra + Hono 
import type { Context } from "hono";
import { Agent } from "@mastra/core";
import { MastraProviders, Models } from "../providers";
import { extractText, trace } from "./utils";

type ProviderKind = "workers-ai" | "openai"; // keep this exact string everywhere

type AgentOpts = {
  provider?: ProviderKind;
  model?: string;
  name?: string;
  instructions?: string;
};

type VNextMessage = { role: "system" | "user" | "assistant"; content: string };

export class MastraAgent {
  private agent: Agent;

  constructor(c: Context, opts: AgentOpts = {}) {
    const providerKind: ProviderKind = opts.provider ?? "workers-ai";

    const provider =
      providerKind === "workers-ai"
        ? MastraProviders.workersai({ context: c })
        : MastraProviders.openai({ context: c });

    if (typeof provider !== "function") {
      throw new Error(
        `Provider init failed. Check env for ${
          providerKind === "openai" ? "OPENAI_API_KEY" : "CLOUDFLARE_API_TOKEN"
        } and AI Gateway vars.`
      );
    }

    const defaultModel =
      providerKind === "openai"
        ? (Models.OpenAI.GPT_4O_MINI ?? "gpt-4o-mini")
        : (Models.WorkersAI.LLAMA_3_1_8B ?? "@cf/meta/llama-3.1-8b-instruct");

    const modelId = opts.model ?? defaultModel;

    // v5: the model field can be a function that returns a provider-bound model
    const modelThunk = () => provider(modelId);

    const cfg = {
      name: opts.name ?? "agent",
      instructions: opts.instructions ?? "You are a helpful AI assistant.",
      model: modelThunk,
    } as unknown as ConstructorParameters<typeof Agent>[0];

    this.agent = new Agent(cfg);

    const a: any = this.agent;
    const cfRay = c.req.raw.headers.get("cf-ray");

    trace("[agent:ready]", {
      providerKind,
      modelId,
      name: cfg.name,
      cfRay,
      modelIsFunction: typeof (cfg as any).model === "function",
      hasGenerateVNext: typeof a?.generateVNext === "function",
      hasStreamVNext: typeof a?.streamVNext === "function",
      hasGenerate: typeof a?.generate === "function",
      hasChat: typeof a?.chat === "function",
      env: {
        has_CF_ACCOUNT: !!(c as any).env?.CLOUDFLARE_ACCOUNT_ID,
        has_CF_GATEWAY: !!(c as any).env?.CLOUDFLARE_GATEWAY_ID,
        has_CF_TOKEN: !!(c as any).env?.CLOUDFLARE_API_TOKEN,
        has_OPENAI: !!(c as any).env?.OPENAI_API_KEY,
      },
    });
  }

  /** One-shot text generation (v5). */
  async generateVNext(prompt: string): Promise<string> {
    const a: any = this.agent;

    trace("[agent:generateVNext:start]", {
      promptPreview: String(prompt).slice(0, 120),
      hasGenerateVNext: typeof a?.generateVNext === "function",
    });

    if (typeof a.generateVNext === "function") {
      // Ensure AISDK format for consistent parsing
      const res = await a.generateVNext(prompt, { format: "aisdk" });
      const out = extractText(res);

      trace("[agent:generateVNext:end]", {
        ok: true,
        textPreview: out.slice(0, 120),
      });

      return out;
    }

    throw new Error("This agent requires v5 methods (generateVNext/streamVNext).");
  }

  /** Chat-style (v5). Accepts string or VNextMessage[]. */
  async chat(messages: string | VNextMessage[]): Promise<string> {
    const a: any = this.agent;
    const vnextMsgs: VNextMessage[] =
      typeof messages === "string" ? [{ role: "user", content: messages }] : messages;

    if (typeof a.generateVNext === "function") {
      const res = await a.generateVNext(vnextMsgs, { format: "aisdk" });
      return extractText(res);
    }

    if (typeof a.streamVNext === "function") {
      const stream = await a.streamVNext(vnextMsgs, { format: "aisdk" });
      let out = "";
      for await (const ev of stream) {
        // Handle common delta shapes; ignore tool calls for now
        if (typeof ev?.delta === "string") out += ev.delta;
        else if (typeof ev?.text === "string") out += ev.text;
        else if (typeof ev?.content === "string") out += ev.content;
      }
      return out;
    }

    throw new Error("This agent requires v5 methods (generateVNext/streamVNext).");
  }

  /** If you need to return a v5 HTTP stream directly (nice for ai/react clients). */
  async chatAsAIStreamResponse(messages: VNextMessage[] | string) {
    const a: any = this.agent;
    const vnextMsgs: VNextMessage[] =
      typeof messages === "string" ? [{ role: "user", content: messages }] : messages;

    if (typeof a.streamVNext === "function") {
      const stream = await a.streamVNext(vnextMsgs, { format: "aisdk" });
      if (typeof (stream as any)?.toAIStreamResponse === "function") {
        return (stream as any).toAIStreamResponse();
      }
    }
    // Fallback: build a Response from concatenated text
    const text = await this.chat(vnextMsgs);
    return new Response(text, { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
}

export default MastraAgent;
