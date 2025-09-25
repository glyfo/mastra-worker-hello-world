// src/lib/simple-agent.ts
import type { Context } from "hono";
import { Agent } from "@mastra/core";
import { MastraProviders, Models } from "../providers";
import { extractText } from "./utils";

type ProviderKind = "worker-ai" | "openai";

type AgentOpts = {
  provider?: ProviderKind;   // only "worker-ai" or "openai"
  model?: string;            // optional explicit model id
  name?: string;
  instructions?: string;
};

type VNextMessage = { role: "system" | "user" | "assistant"; content: string };

export class SimpleAgent {
  private agent: Agent;

  constructor(c: Context, opts: AgentOpts = {}) {
    const providerKind: ProviderKind = opts.provider ?? "worker-ai";

    // Build the Mastra v5 provider (callable) from our factory
    const provider =
      providerKind === "worker-ai"
        ? MastraProviders.workerai({ context: c }) // Workers AI via CF AI Gateway
        : MastraProviders.openai({ context: c });     // OpenAI via CF AI Gateway

    if (typeof provider !== "function") {
      throw new Error(
        `Provider init failed. Ensure Cloudflare AI Gateway env vars are set and ${
          providerKind === "openai" ? "OPENAI_API_KEY" : "CLOUDFLARE_API_TOKEN"
        } is present.`
      );
    }

    // Choose per-provider default model unless overridden
    const defaultModel =
      providerKind === "openai"
        ? (Models.OpenAI.GPT_4O_MINI ?? "gpt-4o-mini")
        : (Models.WorkersAI.LLAMA_3_1_8B ?? "@cf/meta/llama-3.1-8b-instruct");

    const modelId = opts.model ?? defaultModel;

    // v5 provider usage: () => provider(modelId) returns a v5 model function
    const modelThunk = () => provider(modelId);

    const cfg = {
      name: opts.name ?? "agent",
      instructions: opts.instructions ?? "You are a helpful AI assistant.",
      model: modelThunk,
    } as unknown as ConstructorParameters<typeof Agent>[0];

    this.agent = new Agent(cfg);
  }

  /** One-shot text generation (v5): pass a STRING to generateVNext; fallback to streamVNext */
  async generateVNext(prompt: string): Promise<string> {
    const a: any = this.agent;

    if (typeof a.generateVNext === "function") {
      const res = await a.generateVNext(prompt); // v5 non-stream accepts string
      return extractText(res);
    }

    if (typeof a.streamVNext === "function") {
      const stream = await a.streamVNext([{ role: "user", content: prompt } as VNextMessage]);
      let out = "";
      for await (const ev of stream) {
        out +=
          (typeof ev?.delta === "string" && ev.delta) ||
          (typeof ev?.text === "string" && ev.text) ||
          (typeof ev?.content === "string" && ev.content) ||
          "";
      }
      return out;
    }

    throw new Error("This agent requires v5 methods (generateVNext/streamVNext).");
  }

  /** Chat-style (v5): pass a MESSAGES ARRAY to vNext; fallback to streamVNext */
  async chat(messages: string | VNextMessage[]): Promise<string> {
    const a: any = this.agent;
    const vnextMsgs: VNextMessage[] =
      typeof messages === "string" ? [{ role: "user", content: messages }] : messages;

    if (typeof a.generateVNext === "function") {
      const res = await a.generateVNext(vnextMsgs); // v5 non-stream accepts messages array
      return extractText(res);
    }

    if (typeof a.streamVNext === "function") {
      const stream = await a.streamVNext(vnextMsgs);
      let out = "";
      for await (const ev of stream) {
        out +=
          (typeof ev?.delta === "string" && ev.delta) ||
          (typeof ev?.text === "string" && ev.text) ||
          (typeof ev?.content === "string" && ev.content) ||
          "";
      }
      return out;
    }

    throw new Error("This agent requires v5 methods (generateVNext/streamVNext).");
  }
}

export default SimpleAgent;
