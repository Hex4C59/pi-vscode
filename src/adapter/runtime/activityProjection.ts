import { redactCredentialLikeText, type ActivityItem } from "../../extension/contracts/index.js";
import type { RuntimeFrameEvent } from "./rpc-events.js";
const LIMIT = 16_384;
export function displayText(value: string): string { return redactCredentialLikeText(value); }
export class ActivityProjection {
  private sequence = 0;
  private messageId = 'message-0';
  private items = new Map<string,ActivityItem>();
  currentMessageId():string {return this.messageId;}
  reset():void {this.sequence=0;this.messageId='message-0';this.items.clear();}
  parse(e:RuntimeFrameEvent):ActivityItem[] {
    const msg='message' in e ? e.message : undefined;
    if(e.type==='message_start' && msg?.role==='assistant')this.messageId=`message-${++this.sequence}`;
    const a=e.type === 'message_update' ? e.assistantMessageEvent : undefined;
    if(e.type==='message_update' && a && ['thinking_start','thinking_delta','thinking_end'].includes(String(a.type)) && Number.isSafeInteger(a.contentIndex) && (a.contentIndex as number)>=0) {
      const id=`${this.messageId}-thinking-${a.contentIndex}`; const previous=this.items.get(id);
      const final = a.type === 'thinking_end' && typeof a.content === 'string';
      const text = final ? a.content as string : (previous?.text ?? '') + (a.type === 'thinking_delta' && typeof a.delta === 'string' ? a.delta : '');
      return this.put({id,kind:'thinking',messageId:this.messageId,contentIndex:a.contentIndex as number,text,status:a.type==='thinking_end'?'complete':'thinking',truncated:final?false:previous?.truncated??false});
    }
    if(e.type==='message_end' && msg?.role==='assistant' && Array.isArray(msg.content)) {
      return msg.content.flatMap((part,index:number)=>part.type==='thinking' && typeof part.thinking==='string'?this.put({id:`${this.messageId}-thinking-${index}`,kind:'thinking',messageId:this.messageId,contentIndex:index,text:part.thinking,status:'complete',truncated:false}):[]);
    }
    if(e.type==='tool_execution_start' || e.type==='tool_execution_update' || e.type==='tool_execution_end') {
      const id=`tool-${e.toolCallId}`;const prior=this.items.get(id);
      const text=e.content?e.content.filter(p=>p.type==='text').map(p=>p.text).join('\n'):prior?.text??'';
      return this.put({id,kind:'tool',messageId:prior?.messageId??this.messageId,toolCallId:e.toolCallId,tool:typeof e.toolName==='string'?e.toolName.slice(0,100):prior?.tool,text,input:prior?.input??e.input,status:e.type==='tool_execution_start'?'preparing':e.type==='tool_execution_end'?(e.isError?'failed':'complete'):'executing',truncated:prior?.truncated??false});
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
    const text=displayText(item.text); const input=item.input?displayText(item.input):undefined;
    item={...item,text:text.slice(0,LIMIT),input:input?.slice(0,LIMIT),truncated:item.truncated||text.length>LIMIT||(input?.length??0)>LIMIT};this.items.set(item.id,item);return [item];
  }
}
