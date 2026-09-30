/** Request identities, pending RPC replies, timeouts and pauseable remaining startup budget. */

export type RpcResponse = {
  id: string;
  type: "response";
  command: string;
  success: boolean;
  data?: unknown;
  error?: unknown;
};

export type RpcReplyResult =
  | { kind: "response"; response: RpcResponse }
  | { kind: "failure"; reason: "protocol-error" | "disconnected" | "timeout" };

export const RPC_PROTOCOL_ERROR = "Runtime protocol validation failed. Explicit recovery is required.";

export function requireRpcResponse(result: RpcReplyResult): RpcResponse {
  if (result.kind === "response") return result.response;
  throw new Error(result.reason === "protocol-error" ? RPC_PROTOCOL_ERROR
    : result.reason === "timeout" ? "Timed out waiting for RPC response" : "Runtime disconnected during request.");
}

export function createRpcReplies() {
  const pending = new Map<string, { command: string; settle(value: RpcReplyResult): void; dispose(): void }>();
  let requestCounter = 0;
  let pauseable: { pause(): void; resume(): void } | undefined;

  const take = (): number => {
    if (requestCounter >= Number.MAX_SAFE_INTEGER) throw new Error("Runtime request identities exhausted.");
    return ++requestCounter;
  };

  return {
    exhausted(): boolean {
      return requestCounter >= Number.MAX_SAFE_INTEGER;
    },
    startupId(token: number): string {
      return `pi-vscode-get-state-${token}`;
    },
    rpcId(session: number): string {
      return `pi-vscode-rpc-${session}-${take()}`;
    },
    promptId(session: number): string {
      return `pi-vscode-prompt-${session}-${take()}`;
    },
    wait(requestId: string, command: string, timeoutMs: number, options?: { pauseable?: boolean; outstanding?: () => number }): Promise<RpcReplyResult> {
      return new Promise(resolve => {
        let remaining = timeoutMs;
        let armedAt = performance.now();
        let timer: ReturnType<typeof setTimeout> | undefined;
        const clear = (): void => {
          if (timer) clearTimeout(timer);
          timer = undefined;
          if (pauseable === deadline) pauseable = undefined;
        };
        const expire = (): void => {
          clear();
          pending.delete(requestId);
          resolve({ kind: "failure", reason: "timeout" });
        };
        const deadline = {
          pause() {
            if (timer) {
              remaining = Math.max(0, remaining - (performance.now() - armedAt));
              clearTimeout(timer);
              timer = undefined;
              if (remaining === 0) expire();
            }
          },
          resume() {
            if (!timer && pending.has(requestId)) {
              armedAt = performance.now();
              timer = setTimeout(expire, remaining);
            }
          },
        };
        pending.set(requestId, { command, dispose: clear, settle: resolve });
        if (options?.pauseable) pauseable = deadline;
        if (!options?.pauseable || (options.outstanding?.() ?? 0) === 0) deadline.resume();
      });
    },
    watch(requestId: string, command: string, onResponse: (value: RpcReplyResult) => void): void {
      pending.set(requestId, { command, settle: onResponse, dispose() {} });
    },
    receive(parsed: Record<string, unknown>): "ignored" | "received" | "protocol-error" {
      if (parsed.type !== "response" || typeof parsed.id !== "string") return "ignored";
      const waiting = pending.get(parsed.id);
      if (!waiting) return "ignored";
      // Consume before invoking callbacks: cleanup/reentrancy cannot settle this identity twice.
      pending.delete(parsed.id);
      waiting.dispose();
      if (parsed.command !== waiting.command || typeof parsed.success !== "boolean") {
        waiting.settle({ kind: "failure", reason: "protocol-error" });
        return "protocol-error";
      }
      waiting.settle({ kind: "response", response: {
        type: "response", id: parsed.id, command: waiting.command, success: parsed.success,
        ...(parsed.data !== undefined ? { data: parsed.data } : {}),
        ...(parsed.error !== undefined ? { error: parsed.error } : {}),
      } });
      return "received";
    },
    drop(requestId: string): void {
      const waiting = pending.get(requestId);
      pending.delete(requestId);
      waiting?.dispose();
    },
    failAll(reason: "disconnected" | "protocol-error" = "disconnected"): void {
      const waiting = [...pending.values()];
      pending.clear();
      pauseable = undefined;
      for (const request of waiting) request.dispose();
      for (const request of waiting) request.settle({ kind: "failure", reason });
    },
    pauseRemaining(): void {
      pauseable?.pause();
    },
    resumeRemaining(outstanding: number): void {
      if (outstanding === 0) pauseable?.resume();
    },
  };
}
