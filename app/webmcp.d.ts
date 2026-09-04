type WebMcpTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute(input: unknown): Promise<unknown> | Record<string, unknown>;
};

interface WebMcpContext {
  registerTool(tool: WebMcpTool, options?: { signal?: AbortSignal }): void | Promise<void>;
}

declare global {
  interface Document {
    readonly modelContext?: WebMcpContext;
  }
}

export {};
