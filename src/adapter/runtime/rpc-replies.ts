/** Request identities, pending RPC replies, timeouts and pauseable remaining startup budget. */

export type RpcResponse = {
  id?: string;
  type?: string;
  command?: string;
  success?: boolean;
  data?: unknown;
  finalError?: string;
  error?: unknown;
};

export function createRpcReplies() {
  const pending = new Map<string, (value: RpcResponse) => void>();
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
    wait(requestId: string, timeoutMs: number, options?: { pauseable?: boolean; outstanding?: () => number }): Promise<RpcResponse> {
      return new Promise((resolve, reject) => {
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
          reject(new Error("Timed out waiting for RPC response"));
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
        pending.set(requestId, response => {
          clear();
          resolve(response);
        });
        if (options?.pauseable) pauseable = deadline;
        if (!options?.pauseable || (options.outstanding?.() ?? 0) === 0) deadline.resume();
      });
    },
    watch(requestId: string, onResponse: (value: RpcResponse) => void): void {
      pending.set(requestId, onResponse);
    },
    receive(parsed: Record<string, unknown>): boolean {
      const id = typeof parsed.id === "string" ? parsed.id : undefined;
      if (parsed.type === "response" && id && pending.has(id)) {
        pending.get(id)!(parsed as RpcResponse);
        pending.delete(id);
        return true;
      }
      return false;
    },
    drop(requestId: string): void {
      pending.delete(requestId);
    },
    failAll(): void {
      for (const resolve of pending.values()) resolve({ success: false });
      pending.clear();
      pauseable = undefined;
    },
    pauseRemaining(): void {
      pauseable?.pause();
    },
    resumeRemaining(outstanding: number): void {
      if (outstanding === 0) pauseable?.resume();
    },
  };
}
