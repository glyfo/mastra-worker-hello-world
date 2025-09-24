// src/lib/simple-agent.ts
import type { Context } from "hono";
import { Agent } from "@mastra/core";
import { MastraProviders, Models } from "../providers";
import { extractText } from "./utils";

type AgentOpts = {
  provider?: "cloudflare" | "openai" | "auto";
  model?: string;
  name?: string;
  instructions?: string;
};

type VNextMessage = { role: "system" | "user" | "assistant"; content: string };

export class SimpleAgent {
  private agent: Agent;

  constructor(c: Context, opts: AgentOpts = {}) {
    const provider =
      opts.provider === "cloudflare"
        ? MastraProviders.cloudflare({ context: c })
        : opts.provider === "openai"
        ? MastraProviders.openai({ context: c })
        : MastraProviders.auto(c);

    const modelId = opts.model ?? Models.WorkersAI.LLAMA_3_1_8B;

    // With v5 providers, returning () => provider(modelId) yields a v5 model function.
    const modelThunk = () => provider(modelId);

    const cfg = {
      name: opts.name ?? "agent",
      instructions: opts.instructions ?? "You are a helpful AI assistant.",
      model: modelThunk,
    } as unknown as ConstructorParameters<typeof Agent>[0];

    this.agent = new Agent(cfg);
  }

  /** One-shot text generation (v5): try generateVNext non-stream, then streamVNext */
  async generate(prompt: string): Promise<string> {
    const a: any = this.agent;

    if (typeof a.generateVNext === "function") {
      const res = await a.generateVNext({ prompt, stream: false });
      return extractText(res);
    }

    if (typeof a.streamVNext === "function") {
      const stream = await a.streamVNext([{ role: "user", content: prompt } as VNextMessage]);
      let out = "";
      for await (const ev of stream) {
        const piece =
          (typeof ev?.delta === "string" && ev.delta) ||
          (typeof ev?.text === "string" && ev.text) ||
          (typeof ev?.content === "string" && ev.content) ||
          "";
        out += piece;
      }
      return out;
    }

    throw new Error("This agent requires v5 methods (generateVNext/streamVNext).");
  }

  /** Chat-style (v5): pass messages to vNext; fallback to streamVNext if needed */
  async chat(messages: string | VNextMessage[]): Promise<string> {
    const a: any = this.agent;
    const vnextMsgs: VNextMessage[] =
      typeof messages === "string" ? [{ role: "user", content: messages }] : messages;

    if (typeof a.generateVNext === "function") {
      const res = await a.generateVNext(vnextMsgs);
      return extractText(res);
    }

    if (typeof a.streamVNext === "function") {
      const stream = await a.streamVNext(vnextMsgs);
      let out = "";
      for await (const ev of stream) {
        const piece =
          (typeof ev?.delta === "string" && ev.delta) ||
          (typeof ev?.text === "string" && ev.text) ||
          (typeof ev?.content === "string" && ev.content) ||
          "";
        out += piece;
      }
      return out;
    }

    throw new Error("This agent requires v5 methods (generateVNext/streamVNext).");
  }
}

export default SimpleAgent;
