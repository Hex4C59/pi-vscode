import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type ApprovalCard = { id: string; toolCallId: string; tool: string; input: string; scope: string | null; expiresAt: number };
export type SessionGrant = { id: string; scope: string };
export type ApprovalDecision = "once" | "session" | "deny";
export interface GateCall { runtime: string; cwd: string; request: string; toolCallId: string; tool: string; input: Record<string, unknown> }
const tools = new Set(["read", "write", "edit", "bash", "powershell", "grep", "find", "ls"]);
export function parseGateEnvelope(value: unknown): (GateCall & { kind: "call" }) | { kind: "hello"; runtime: string; cwd: string } | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const e = value as Record<string, unknown>;
  if (e.protocol !== "pi-vscode-approval" || e.version !== 1 || typeof e.runtime !== "string" || typeof e.cwd !== "string") return;
  if (e.kind === "hello") return {kind:"hello", runtime:e.runtime, cwd:e.cwd};
  if(e.kind !== "call" || typeof e.request !== "string" || e.request.length > 100 || typeof e.toolCallId !== "string" || e.toolCallId.length > 200 || typeof e.tool !== "string" || !tools.has(e.tool) || !e.input || typeof e.input !== "object" || Array.isArray(e.input)) return;
  return {kind:"call", runtime:e.runtime,cwd:e.cwd,request:e.request,toolCallId:e.toolCallId,tool:e.tool,input:e.input as Record<string,unknown>};
}
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
    const resolved = await realpath(path.resolve(root, target));
    const relative = path.relative(root, resolved);
    const inside = relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
    // Recursive search can follow links and glob across targets: ask, never auto-allow.
    const file = (await stat(resolved)).isFile();
    return {auto:call.tool === 'read' && inside && file,scope:file ? JSON.stringify([call.tool, resolved]) : null};
  } catch { return {auto:false,scope:null}; }
}
export class ToolApprovals {
  private pending = new Map<string, { card: ApprovalCard; resolve: (allow:boolean)=>void; timer: ReturnType<typeof setTimeout> }>();
  private grants = new Map<string,SessionGrant>();
  private epoch = 0;
  constructor(private readonly changed: ()=>void, private readonly timeout = 120_000) {}
  cards(): ApprovalCard[] { return [...this.pending.values()].map(p=>p.card); }
  scopes(): SessionGrant[] { return [...this.grants.values()]; }
  revoke(id:string):void {this.grants.delete(id);this.changed();}
  cancel(reset=false):void {this.epoch++;for(const id of this.pending.keys())this.decide(id,'deny');if(reset)this.grants.clear();this.changed();}
  decide(id:string, decision:ApprovalDecision):boolean {
    const p=this.pending.get(id);if(!p)return false;
    this.pending.delete(id);clearTimeout(p.timer);
    const allow=decision !== 'deny' && Date.now()<p.card.expiresAt;
    if(allow && decision==='session' && p.card.scope && this.grants.size<64) {const grant={id:randomUUID(),scope:p.card.scope};this.grants.set(grant.id,grant);}
    p.resolve(allow);this.changed();return true;
  }
  async request(call:GateCall):Promise<boolean> {
    const epoch=this.epoch;const input=JSON.stringify(call.input);
    // Full snapshot must be reviewable; credential-like fields are not sent to UI.
    if(input.length>32_768 || /(?:api[_-]?key|authorization|password|secret|access[_-]?token)\s*["']?\s*[:=]/i.test(input) || this.pending.size>=8)return false;
    let policy;try{policy=await inspectScope(call);}catch{return false;}
    if(epoch!==this.epoch)return false;
    if(policy.auto || (policy.scope && [...this.grants.values()].some(g=>g.scope===policy.scope)))return true;
    return new Promise(resolve=>{const id=call.request;if(this.pending.has(id)){resolve(false);return;}const card={id,toolCallId:call.toolCallId,tool:call.tool,input,scope:policy.scope,expiresAt:Date.now()+this.timeout};const timer=setTimeout(()=>this.decide(id,'deny'),this.timeout);this.pending.set(id,{card,resolve,timer});this.changed();});
  }
}
