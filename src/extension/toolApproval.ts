import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { resolveWriteTargetPath } from "./writeProtection.js";

import type { ApprovalCard } from "./webviewProtocol.js";
export type { ApprovalCard } from "./webviewProtocol.js";
import type { SessionGrant } from "./webviewProtocol.js";
export type { SessionGrant } from "./webviewProtocol.js";
import type { ApprovalDecision } from "./webviewProtocol.js";
export type { ApprovalDecision } from "./webviewProtocol.js";
import type { GateCall } from "./approvalProtocol.js";
/** Reject Windows device/ADS/drive-relative/ambiguous names even on other hosts. */
export function unambiguousPath(value: string): boolean {
  return value.length > 0 && !/^[~@]/.test(value) && ![...value].some(c => c.charCodeAt(0) < 32) && !/^(?:\\\\[?.]\\|[a-z]:(?![\\/]))/i.test(value)
    && !value.replace(/^[a-z]:/i, "").includes(":") && !value.split(/[\\/]/).some(p => /[ .]$/.test(p) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p));
}
export async function inspectScope(call: GateCall): Promise<{ auto: boolean; scope: string | null }> {
  const input = call.input;
  if (call.tool === "bash" || call.tool === "powershell") return {auto:false,scope:typeof input.command === "string" ? JSON.stringify([call.tool, await realpath(call.cwd), input]) : null};
  const target = input.path ?? (['ls','find','grep'].includes(call.tool) ? '.' : undefined);
  if (typeof target !== "string" || !unambiguousPath(target)) return {auto:false,scope:null};
  try {
    const root = await realpath(call.cwd);
    // A normalized upstream spelling must not reuse a grant for a different raw-name file.
    // Keep such calls once-only rather than widening the approved scope policy.
    if ((call.tool === "write" || call.tool === "edit") && path.resolve(root, target) !== resolveWriteTargetPath(target, root)) return { auto: false, scope: null };
    const resolved = await realpath(path.resolve(root, target));
    const relative = path.relative(root, resolved);
    const inside = relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
    // Recursive search can follow links and glob across targets: ask, never auto-allow.
    const file = (await stat(resolved)).isFile();
    return {auto:call.tool === 'read' && inside && file,scope:file ? JSON.stringify([call.tool, resolved]) : null};
  } catch { return {auto:false,scope:null}; }
}
export class ToolApprovals {
  private pending = new Map<string, { card: ApprovalCard; resolve: (decision:ApprovalDecision)=>void; timer: ReturnType<typeof setTimeout> }>();
  private grants = new Map<string,SessionGrant>();
  private epoch = 0;
  constructor(private readonly changed: ()=>void, private readonly timeout = 120_000, private readonly canExecute: (call: GateCall, phase: "initial" | "final") => Promise<boolean> = async () => true, private readonly completed: (call: GateCall, allowed: boolean) => void = () => {}) {}
  cards(): ApprovalCard[] { return [...this.pending.values()].map(p=>p.card); }
  scopes(): SessionGrant[] { return [...this.grants.values()]; }
  revoke(id:string):void {this.grants.delete(id);this.changed();}
  cancel(reset=false):void {this.epoch++;for(const id of this.pending.keys())this.decide(id,'deny');if(reset)this.grants.clear();this.changed();}
  decide(id:string, decision:ApprovalDecision):boolean {
    const p=this.pending.get(id);if(!p)return false;
    this.pending.delete(id);clearTimeout(p.timer);
    const allow=decision !== 'deny' && Date.now()<p.card.expiresAt;
    p.resolve(allow ? decision : "deny");this.changed();return true;
  }
  async request(call:GateCall):Promise<boolean> {
    let allowed = false;
    try { allowed = await this.evaluate(call); return allowed; }
    finally { this.completed(call, allowed); }
  }
  private async evaluate(call:GateCall):Promise<boolean> {
    const epoch=this.epoch;const input=JSON.stringify(call.input);
    const expiresAt = Date.now() + this.timeout;
    const current = () => epoch === this.epoch && Date.now() < expiresAt;
    // Full snapshot must be reviewable; credential-like fields are not sent to UI.
    if(input.length>32_768 || /(?:api[_-]?key|authorization|password|secret|access[_-]?token)\s*["']?\s*[:=]/i.test(input) || this.pending.size>=8)return false;
    if (!await this.canExecute(call, "initial") || !current()) return false;
    let policy;try{policy=await inspectScope(call);}catch{return false;}
    if(!current())return false;
    const grant = policy.scope ? [...this.grants.values()].find(g => g.scope === policy.scope) : undefined;
    if(policy.auto || grant) {
      const allowed = await this.canExecute(call, "final");
      return allowed && current() && (policy.auto || (grant !== undefined && this.grants.has(grant.id)));
    }
    const decision = await new Promise<ApprovalDecision>(resolve=>{const id=call.request;if(this.pending.has(id)){resolve("deny");return;}const card={id,toolCallId:call.toolCallId,tool:call.tool,input,scope:policy.scope,expiresAt};const timer=setTimeout(()=>this.decide(id,'deny'),Math.max(0, expiresAt - Date.now()));this.pending.set(id,{card,resolve,timer});this.changed();});
    if (decision === "deny" || !current() || !await this.canExecute(call, "final") || !current()) return false;
    if (decision === "session" && policy.scope && this.grants.size < 64) {
      const grant = { id: randomUUID(), scope: policy.scope };
      this.grants.set(grant.id, grant); this.changed();
    }
    return true;
  }
}
