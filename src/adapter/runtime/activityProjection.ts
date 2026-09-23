import type { ActivityItem } from "../../extension/contracts/runtimeLifecycle.js";
const LIMIT = 16_384;
export function displayText(value: string): string { return value.replace(/\b(Bearer\s+)[\w.+/=-]+/gi,'$1[redacted]').replace(/((?:api[_-]?key|password|secret|access[_-]?token)\s*["']?\s*[:=]\s*["']?)[^\s"',;}]+/gi,'$1[redacted]'); }
export class ActivityProjection {
  private sequence = 0;
  private messageId = 'message-0';
  private items = new Map<string,ActivityItem>();
  currentMessageId():string {return this.messageId;}
  reset():void {this.sequence=0;this.messageId='message-0';this.items.clear();}
  parse(e:Record<string,unknown>):ActivityItem[] {
    const msg=e.message as Record<string,unknown>|undefined;
    if(e.type==='message_start' && msg?.role==='assistant')this.messageId=`message-${++this.sequence}`;
    const a=e.assistantMessageEvent as Record<string,unknown>|undefined;
    if(e.type==='message_update' && a && ['thinking_start','thinking_delta','thinking_end'].includes(String(a.type)) && Number.isSafeInteger(a.contentIndex) && (a.contentIndex as number)>=0) {
      const id=`${this.messageId}-thinking-${a.contentIndex}`; const previous=this.items.get(id);
      const final = a.type === 'thinking_end' && typeof a.content === 'string';
      const text = final ? a.content as string : (previous?.text ?? '') + (a.type === 'thinking_delta' && typeof a.delta === 'string' ? a.delta : '');
      return this.put({id,kind:'thinking',messageId:this.messageId,contentIndex:a.contentIndex as number,text,status:a.type==='thinking_end'?'complete':'thinking',truncated:final?false:previous?.truncated??false});
    }
    if(e.type==='message_end' && msg?.role==='assistant' && Array.isArray(msg.content)) {
      return msg.content.flatMap((part:Record<string,unknown>,index:number)=>part.type==='thinking' && typeof part.thinking==='string'?this.put({id:`${this.messageId}-thinking-${index}`,kind:'thinking',messageId:this.messageId,contentIndex:index,text:part.thinking,status:'complete',truncated:false}):[]);
    }
    if(typeof e.toolCallId==='string' && e.toolCallId.length<=200 && typeof e.type==='string' && e.type.startsWith('tool_execution_')) {
      const id=`tool-${e.toolCallId}`;const prior=this.items.get(id);
      const result=(e.partialResult??e.result) as Record<string,unknown>|undefined;
      const text=Array.isArray(result?.content)?result.content.filter((p:Record<string,unknown>)=>p.type==='text'&&typeof p.text==='string').map((p:Record<string,unknown>)=>p.text).join('\n'):prior?.text??'';
      return this.put({id,kind:'tool',messageId:prior?.messageId??this.messageId,toolCallId:e.toolCallId,tool:typeof e.toolName==='string'?e.toolName.slice(0,100):prior?.tool,text,input:prior?.input??(e.args?JSON.stringify(e.args):undefined),status:e.type==='tool_execution_start'?'preparing':e.type==='tool_execution_end'?(e.isError?'failed':'complete'):'executing',truncated:prior?.truncated??false});
    }
    return [];
  }
  private put(item:ActivityItem):ActivityItem[] {
    // Reserve the final slot for a host notice, not invented model thinking.
    if(!this.items.has(item.id)&&this.items.size>=63) {
      const id='activity-overflow';
      const notice:ActivityItem=this.items.get(id)??{id,kind:'tool',tool:'Activity display limit',messageId:this.messageId,text:'Additional activity is omitted from this display. Execution and approval checks continue; this is a display limit, not a tool result.',status:'complete',truncated:true};
      this.items.set(id,notice);return [notice];
    }
    item={...item,text:displayText(item.text.slice(0,LIMIT)),input:item.input?displayText(item.input.slice(0,LIMIT)):undefined,truncated:item.truncated||item.text.length>LIMIT||(item.input?.length??0)>LIMIT};this.items.set(item.id,item);return [item];
  }
}
