export type InteractionMethod = 'select' | 'confirm' | 'input' | 'editor';

export type InteractionOption = Readonly<{
  id: string;
  label: string;
}>;

export type InteractionFormInput =
  | Readonly<{ method: 'select'; title: string; options: readonly InteractionOption[]; timeoutMs?: number }>
  | Readonly<{ method: 'confirm'; title: string; message: string; timeoutMs?: number }>
  | Readonly<{ method: 'input'; title: string; placeholder?: string; timeoutMs?: number }>
  | Readonly<{ method: 'editor'; title: string; prefill?: string; timeoutMs?: number }>;

export type InteractionAnswer =
  | Readonly<{ method: 'select'; optionId: string }>
  | Readonly<{ method: 'confirm'; value: boolean }>
  | Readonly<{ method: 'input' | 'editor'; text: string }>;

export type InteractionFormProjection =
  | Readonly<{ id: string; method: 'select'; title: string; origin: 'trusted runtime extension; not authenticated'; localCutoffAt?: number; options: readonly InteractionOption[] }>
  | Readonly<{ id: string; method: 'confirm'; title: string; origin: 'trusted runtime extension; not authenticated'; localCutoffAt?: number; message: string }>
  | Readonly<{ id: string; method: 'input'; title: string; origin: 'trusted runtime extension; not authenticated'; localCutoffAt?: number; placeholder?: string }>
  | Readonly<{ id: string; method: 'editor'; title: string; origin: 'trusted runtime extension; not authenticated'; localCutoffAt?: number; prefill?: string }>;

export type InteractionCancelReason =
  | 'user'
  | 'stop'
  | 'reset'
  | 'dispose'
  | 'local-cutoff'
  | 'overflow'
  | 'overflow-barrier'
  | 'unavailable';

export type InteractionReply =
  | Readonly<{ kind: 'answer'; answer: InteractionAnswer }>
  | Readonly<{ kind: 'cancel'; reason: InteractionCancelReason }>;

export type InteractionReplyCallback = (reply: InteractionReply) => void | Promise<void>;

export type InteractionView = Readonly<{ viewId: string; generation: number }>;

export type InteractionErrorCode = 'overflow-burst' | 'reply-failed' | 'timer-failed' | 'clock-failed' | 'identifier-exhausted';
export type InteractionPhase = 'idle' | 'waiting' | 'blocked';

export type InteractionSnapshot = Readonly<{
  active: InteractionFormProjection | null;
  queuedCount: number;
  phase: InteractionPhase;
  errorCode: InteractionErrorCode | null;
}>;

export type InteractionAdmissionResult =
  | Readonly<{ status: 'admitted'; id: string }>
  | Readonly<{ status: 'rejected'; reason: 'invalid-form' | 'unsupported-timeout' | 'closed' | 'blocked' | 'overflow' }>;

export type InteractionActionResult =
  | Readonly<{ status: 'applied' }>
  | Readonly<{ status: 'rejected'; reason: 'stale-view' | 'not-active' | 'invalid-answer' | 'closed' | 'disposed' }>;

export interface InteractionClock {
  now(): number;
}

export interface InteractionTimer {
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}

export type InteractionCoordinatorOptions = Readonly<{
  clock?: InteractionClock;
  timer?: InteractionTimer;
}>;

export interface InteractionCoordinator {
  snapshot(): InteractionSnapshot;
  subscribe(listener: (snapshot: InteractionSnapshot) => void): () => void;
  bindView(view: InteractionView): boolean;
  admit(form: InteractionFormInput, reply: InteractionReplyCallback): InteractionAdmissionResult;
  answer(view: InteractionView, id: string, answer: InteractionAnswer): InteractionActionResult;
  cancel(view: InteractionView, id: string): InteractionActionResult;
  stop(): Promise<void>;
  reset(view: InteractionView): Promise<boolean>;
  dispose(): Promise<void>;
}
