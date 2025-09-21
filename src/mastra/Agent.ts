export interface AgentGenerateResult { text: string }

export type AgentOptions = { name?: string; instructions?: string; model?: any };

export default class Agent {
  name?: string;
  instructions?: string;
  model?: any;

  constructor(opts: AgentOptions = {}) {
    this.name = opts.name;
    this.instructions = opts.instructions;
    this.model = opts.model;
  }

  async generate(prompt: string): Promise<AgentGenerateResult> {
    // Minimal stub: echo the prompt for now
    return { text: `Echo: ${prompt}` };
  }
}
