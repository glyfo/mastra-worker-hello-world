// src/lib/simple-agent.ts
import type { Context } from "hono";
import { Agent } from "@mastra/core";
import { MastraProviders, Models } from "../providers";
import { extractText, trace } from "./utils";

type AgentOpts = {
  provider?: "cloudflare" | "openai" | "auto";
  model?: string;
  name?: string;
  instructions?: string;
};

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

    // Provider returns an OpenAI-compatible client via our AI Gateway.
    // Mastra's Agent expects an internal MastraLanguageModel DynamicArgument.
    // We build a thunk (runtime OK) and cast the whole config to the Agent ctor param type.
    const modelThunk = () => provider(modelId);

    const cfg = {
      name: opts.name ?? "agent",
      instructions: opts.instructions ?? "You are a helpful AI assistant.",
      model: modelThunk,
    } as unknown as ConstructorParameters<typeof Agent>[0];

    this.agent = new Agent(cfg);
  }

  /** One-shot text generation; try vNext (non-stream) then fall back to stream() */
  async generate(prompt: string): Promise<string> {
    try {
      const res = await (this.agent as any).generateVNext?.({ prompt, stream: false });
      if (res) return extractText(res);
    } catch (e: any) {
      if (!String(e?.message || "").includes("streamVNext")) {
        trace("SimpleAgent.generate vNext error", { message: e?.message });
      }
    }

    const stream = await (this.agent as any).stream?.(prompt);
    if (!stream) throw new Error("Model does not support generateVNext or stream()");
    let out = "";
    for await (const chunk of stream) {
      if (typeof chunk === "string") out += chunk;
      else if (typeof chunk?.text === "string") out += chunk.text;
      else if (typeof chunk?.delta === "string") out += chunk.delta;
    }
    return out;
  }

  /** Chat-style generation; accepts a string or an array of {role, content} */
  async chat(
    messages: string | Array<{ role: "system" | "user" | "assistant"; content: string }>
  ): Promise<string> {
    try {
      const res = Array.isArray(messages)
        ? await (this.agent as any).generateVNext?.(messages)
        : await (this.agent as any).generateVNext?.(messages);
      if (res) return extractText(res);
    } catch (e: any) {
      if (!String(e?.message || "").includes("streamVNext")) {
        trace("SimpleAgent.chat vNext error", { message: e?.message });
      }
    }

    // Fallback: stream the last user message (or the string itself)
    const last =
      typeof messages === "string"
        ? messages
        : [...messages].reverse().find((m) => m.role === "user")?.content ??
          (Array.isArray(messages) ? messages.at(-1)?.content : "");

    const stream = await (this.agent as any).stream?.(last);
    if (!stream) throw new Error("Model does not support generateVNext or stream()");
    let out = "";
    for await (const chunk of stream) {
      if (typeof chunk === "string") out += chunk;
      else if (typeof chunk?.text === "string") out += chunk.text;
      else if (typeof chunk?.delta === "string") out += chunk.delta;
    }
    return out;
  }
}
