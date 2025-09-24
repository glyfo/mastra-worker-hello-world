// src/lib/simple-agent.ts
import type { Context } from "hono";
import { Agent } from "@mastra/core";
import { MastraProviders, Models } from "../providers";
import { extractText } from "./utils";

type AgentOpts = {
  provider?: "worker-ai" | "openai" | "auto";
  model?: string;
  name?: string;
  instructions?: string;
};

type VNextMessage = { role: "system" | "user" | "assistant"; content: string };

export class SimpleAgent {
  private agent: Agent;

  constructor(c: Context, opts: AgentOpts = {}) {
    const provider =
      opts.provider === "worker-ai"
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

  /** One-shot text generation (v5): pass a STRING to generateVNext; fallback to streamVNext */
  async generateVNext(prompt: string): Promise<string> {
    const a: any = this.agent;

    // v5 non-stream: STRING, not object
    if (typeof a.generateVNext === "function") {
      const res = await a.generateVNext(prompt);
      return extractText(res);
    }

    // v5 streaming: MESSAGES ARRAY
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
      const res = await a.generateVNext(vnextMsgs);
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
