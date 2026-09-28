import type {
  InteractionActionResult,
  InteractionAdmissionResult,
  InteractionAnswer,
  InteractionCoordinator,
  InteractionCoordinatorOptions,
  InteractionErrorCode,
  InteractionFormInput,
  InteractionFormProjection,
  InteractionOption,
  InteractionReply,
  InteractionReplyCallback,
  InteractionSnapshot,
  InteractionTimer,
  InteractionView,
} from './types.js';

const origin = 'trusted runtime extension; not authenticated' as const;
const maxOutstandingForms = 8;
const maxFrameBytes = 65_536;
const maxTextBytes = 32_768;
const maxTitleBytes = 512;
const maxOptionLabelBytes = 1_024;
const maxOptions = 64;
const maxTimeoutMs = 86_400_000;
const maxOpaqueIdBytes = 100;

type Entry = {
  id: string;
  form: InteractionFormProjection;
  reply: InteractionReplyCallback;
  replyAttempted: boolean;
  live: boolean;
  timerHandle?: unknown;
};

type CloseReason = 'stop' | 'reset' | 'dispose' | 'overflow-barrier' | 'unavailable';

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function hasExactKeys(value: unknown, expected: readonly string[]): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every(key => Object.prototype.hasOwnProperty.call(value, key));
}

function hasOnlyKeys(value: unknown, required: readonly string[], optional: readonly string[] = []): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return required.every(key => Object.prototype.hasOwnProperty.call(value, key)) &&
    keys.every(key => required.includes(key) || optional.includes(key));
}

function hasUnsupportedTimeout(form: unknown): boolean {
  if (typeof form !== 'object' || form === null || !Object.prototype.hasOwnProperty.call(form, 'timeoutMs')) return false;
  const timeoutMs = (form as { timeoutMs?: unknown }).timeoutMs;
  return typeof timeoutMs !== 'number' || !Number.isFinite(timeoutMs) || timeoutMs < 0 || timeoutMs > maxTimeoutMs;
}

function validOption(option: unknown): option is InteractionOption {
  return hasExactKeys(option, ['id', 'label']) &&
    typeof option.id === 'string' && utf8Bytes(option.id) > 0 && utf8Bytes(option.id) <= maxOpaqueIdBytes &&
    typeof option.label === 'string' && utf8Bytes(option.label) <= maxOptionLabelBytes;
}

function validForm(form: InteractionFormInput): boolean {
  if (typeof form !== 'object' || form === null || hasUnsupportedTimeout(form)) return false;
  switch (form.method) {
    case 'select':
      return hasOnlyKeys(form, ['method', 'title', 'options'], ['timeoutMs']) &&
        typeof form.title === 'string' && utf8Bytes(form.title) <= maxTitleBytes &&
        Array.isArray(form.options) && form.options.length <= maxOptions &&
        form.options.every(validOption) &&
        new Set(form.options.map(option => option.id)).size === form.options.length;
    case 'confirm':
      return hasOnlyKeys(form, ['method', 'title', 'message'], ['timeoutMs']) &&
        typeof form.title === 'string' && utf8Bytes(form.title) <= maxTitleBytes &&
        typeof form.message === 'string' && utf8Bytes(form.message) <= maxTextBytes;
    case 'input':
      return hasOnlyKeys(form, ['method', 'title'], ['placeholder', 'timeoutMs']) &&
        typeof form.title === 'string' && utf8Bytes(form.title) <= maxTitleBytes &&
        (form.placeholder === undefined || (typeof form.placeholder === 'string' && utf8Bytes(form.placeholder) <= maxTextBytes));
    case 'editor':
      return hasOnlyKeys(form, ['method', 'title'], ['prefill', 'timeoutMs']) &&
        typeof form.title === 'string' && utf8Bytes(form.title) <= maxTitleBytes &&
        (form.prefill === undefined || (typeof form.prefill === 'string' && utf8Bytes(form.prefill) <= maxTextBytes));
    default:
      return false;
  }
}

function projectForm(id: string, form: InteractionFormInput, localCutoffAt?: number): InteractionFormProjection {
  const base = { id, title: form.title, origin, ...(localCutoffAt === undefined ? {} : { localCutoffAt }) };
  switch (form.method) {
    case 'select':
      return { ...base, method: 'select', options: form.options.map(option => ({ id: option.id, label: option.label })) };
    case 'confirm':
      return { ...base, method: 'confirm', message: form.message };
    case 'input':
      return { ...base, method: 'input', ...(form.placeholder === undefined ? {} : { placeholder: form.placeholder }) };
    case 'editor':
      return { ...base, method: 'editor', ...(form.prefill === undefined ? {} : { prefill: form.prefill }) };
  }
}

function copyProjection(form: InteractionFormProjection | null): InteractionFormProjection | null {
  if (!form) return null;
  if (form.method === 'select') return { ...form, options: form.options.map(option => ({ ...option })) };
  return { ...form };
}

function validView(view: InteractionView): boolean {
  return typeof view.viewId === 'string' && utf8Bytes(view.viewId) > 0 && utf8Bytes(view.viewId) <= maxOpaqueIdBytes &&
    Number.isSafeInteger(view.generation) && view.generation >= 0;
}

function isAnswerFor(form: InteractionFormProjection, answer: unknown): answer is InteractionAnswer {
  if (form.method === 'select') {
    return hasExactKeys(answer, ['method', 'optionId']) && answer.method === 'select' &&
      typeof answer.optionId === 'string' && utf8Bytes(answer.optionId) <= maxOpaqueIdBytes &&
      form.options.some(option => option.id === answer.optionId);
  }
  if (form.method === 'confirm') {
    return hasExactKeys(answer, ['method', 'value']) && answer.method === 'confirm' && typeof answer.value === 'boolean';
  }
  return hasExactKeys(answer, ['method', 'text']) && answer.method === form.method &&
    typeof answer.text === 'string' && utf8Bytes(answer.text) <= maxTextBytes;
}

function copyAnswer(answer: InteractionAnswer): InteractionAnswer {
  return { ...answer };
}

export function createInteractionCoordinator(options: InteractionCoordinatorOptions = {}): InteractionCoordinator {
  const clock = options.clock ?? { now: () => Date.now() };
  const timer: InteractionTimer = options.timer ?? {
    setTimeout: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
    clearTimeout: handle => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
  };
  let currentView: InteractionView | null = null;
  let active: Entry | null = null;
  const queue: Entry[] = [];
  const listeners = new Set<(snapshot: InteractionSnapshot) => void>();
  const overflowTimes: number[] = [];
  let nextId = 1;
  let accepting = true;
  let disposed = false;
  let errorCode: InteractionErrorCode | null = null;
  let closeReason: CloseReason = 'unavailable';
  let lifecycleRevision = 0;
  let lifecycleSettled: Promise<void> = Promise.resolve();

  function snapshot(): InteractionSnapshot {
    return {
      active: copyProjection(active?.form ?? null),
      queuedCount: queue.length,
      phase: disposed || !accepting || errorCode ? 'blocked' : active ? 'waiting' : 'idle',
      errorCode,
    };
  }

  function publish(): void {
    const current = snapshot();
    for (const listener of [...listeners]) {
      try { listener(current); } catch { /* A projection subscriber cannot break host arbitration. */ }
    }
  }

  function clearTimer(entry: Entry): boolean {
    if (entry.timerHandle === undefined) return true;
    const handle = entry.timerHandle;
    entry.timerHandle = undefined;
    try {
      timer.clearTimeout(handle);
      return true;
    } catch {
      return false;
    }
  }

  function detachAll(): { entries: Entry[]; timerFailed: boolean } {
    const entries = [...(active ? [active] : []), ...queue];
    active = null;
    queue.length = 0;
    let timerFailed = false;
    for (const entry of entries) {
      entry.live = false;
      if (!clearTimer(entry)) timerFailed = true;
    }
    return { entries, timerFailed };
  }

  function deliver(entry: Entry, result: InteractionReply, suppressFailure = false): Promise<void> {
    if (entry.replyAttempted) return Promise.resolve();
    entry.replyAttempted = true;
    const deliveryRevision = lifecycleRevision;
    try {
      return Promise.resolve(entry.reply(result)).catch(() => {
        if (!suppressFailure && deliveryRevision === lifecycleRevision) fail('reply-failed');
      });
    } catch {
      if (!suppressFailure && deliveryRevision === lifecycleRevision) fail('reply-failed');
      return Promise.resolve();
    }
  }

  function deliverUnadmitted(reply: InteractionReplyCallback, result: InteractionReply): void {
    try {
      void Promise.resolve(reply(result)).catch(() => fail('reply-failed'));
    } catch {
      fail('reply-failed');
    }
  }

  function fail(code: InteractionErrorCode): void {
    if (errorCode === 'reply-failed') return;
    if (disposed && code !== 'reply-failed') return;
    if (errorCode && code !== 'reply-failed') return;
    errorCode = code;
    accepting = false;
    closeReason = 'unavailable';
    currentView = null;
    const { entries, timerFailed } = detachAll();
    if (timerFailed && code !== 'reply-failed') errorCode = 'timer-failed';
    publish();
    for (const entry of entries) void deliver(entry, { kind: 'cancel', reason: 'unavailable' }, true);
  }

  function readNow(): number | undefined {
    try {
      const value = clock.now();
      return Number.isFinite(value) ? value : undefined;
    } catch {
      return undefined;
    }
  }

  function pruneExpiredQueue(now: number): Entry[] {
    const expired: Entry[] = [];
    for (let index = queue.length - 1; index >= 0; index -= 1) {
      const entry = queue[index]!;
      if (entry.form.localCutoffAt !== undefined && entry.form.localCutoffAt <= now) {
        queue.splice(index, 1);
        entry.live = false;
        if (!clearTimer(entry)) fail('timer-failed');
        expired.push(entry);
      }
    }
    return expired.reverse();
  }

  function promoteAfter(now?: number): Entry[] {
    const expired = now === undefined ? [] : pruneExpiredQueue(now);
    active = queue.shift() ?? null;
    return expired;
  }

  function expire(entry: Entry, observedAt?: number): void {
    if (!entry.live || entry.form.localCutoffAt === undefined) return;
    const now = observedAt ?? readNow();
    if (now === undefined) {
      fail('clock-failed');
      return;
    }
    if (now < entry.form.localCutoffAt) {
      entry.timerHandle = undefined;
      try {
        entry.timerHandle = timer.setTimeout(() => expire(entry), entry.form.localCutoffAt - now);
      } catch {
        fail('timer-failed');
      }
      return;
    }

    const wasActive = active === entry;
    if (wasActive) active = null;
    else {
      const index = queue.indexOf(entry);
      if (index < 0) return;
      queue.splice(index, 1);
    }
    entry.live = false;
    const timerCleared = clearTimer(entry);
    const alsoExpired = wasActive ? promoteAfter(now) : pruneExpiredQueue(now);
    if (!timerCleared) fail('timer-failed');
    if (!accepting) {
      void deliver(entry, { kind: 'cancel', reason: 'local-cutoff' }, true);
      for (const expired of alsoExpired) void deliver(expired, { kind: 'cancel', reason: 'local-cutoff' }, true);
      return;
    }
    publish();
    void deliver(entry, { kind: 'cancel', reason: 'local-cutoff' });
    for (const expired of alsoExpired) void deliver(expired, { kind: 'cancel', reason: 'local-cutoff' });
  }

  function expireIfDue(entry: Entry): boolean {
    if (entry.form.localCutoffAt === undefined) return false;
    const now = readNow();
    if (now === undefined) {
      fail('clock-failed');
      return true;
    }
    if (now < entry.form.localCutoffAt) return false;
    expire(entry, now);
    return true;
  }

  function scheduleEntry(entry: Entry): boolean {
    if (entry.form.localCutoffAt === undefined) return true;
    const now = readNow();
    if (now === undefined) {
      fail('clock-failed');
      return false;
    }
    try {
      entry.timerHandle = timer.setTimeout(() => expire(entry), Math.max(0, entry.form.localCutoffAt - now));
      return true;
    } catch {
      fail('timer-failed');
      return false;
    }
  }

  function finish(entry: Entry, result: InteractionReply): boolean {
    const needsClock = queue.some(item => item.form.localCutoffAt !== undefined);
    const now = needsClock ? readNow() : undefined;
    if (needsClock && now === undefined) {
      fail('clock-failed');
      return false;
    }

    entry.live = false;
    const timerCleared = clearTimer(entry);
    if (!timerCleared) fail('timer-failed');
    if (!accepting) {
      void deliver(entry, { kind: 'cancel', reason: closeReason }, true);
      return false;
    }

    active = null;
    const expired = promoteAfter(now);
    if (!accepting) {
      void deliver(entry, { kind: 'cancel', reason: 'unavailable' }, true);
      for (const item of expired) void deliver(item, { kind: 'cancel', reason: 'local-cutoff' }, true);
      return false;
    }
    publish();
    if (!accepting) {
      void deliver(entry, { kind: 'cancel', reason: closeReason }, true);
      return false;
    }
    void deliver(entry, result);

    for (const item of expired) void deliver(item, { kind: 'cancel', reason: 'local-cutoff' });
    return true;
  }

  function runLifecycle(work: () => Promise<void>): Promise<void> {
    const previous = lifecycleSettled;
    let release!: () => void;
    const workFinished = new Promise<void>(resolve => { release = resolve; });
    const current = Promise.all([previous, workFinished]).then(() => undefined);
    lifecycleSettled = current;
    try {
      void work().then(release, release);
    } catch {
      release();
    }
    return current;
  }
  function cancelAll(reason: 'stop' | 'reset' | 'dispose' | 'overflow-barrier' | 'unavailable'): Promise<void> {
    const { entries, timerFailed } = detachAll();
    if (timerFailed) {
      errorCode = 'timer-failed';
      accepting = false;
      closeReason = 'unavailable';
      currentView = null;
    }
    publish();
    return Promise.all(entries.map(entry => deliver(entry, { kind: 'cancel', reason }))).then(() => undefined);
  }

  return {
    snapshot,
    subscribe(listener) {
      if (disposed) return () => undefined;
      listeners.add(listener);
      try { listener(snapshot()); } catch { /* A subscriber failure cannot alter arbitration. */ }
      return () => { listeners.delete(listener); };
    },
    bindView(view) {
      if (disposed || !validView(view)) return false;
      currentView = { ...view };
      publish();
      return true;
    },
    admit(form: InteractionFormInput, reply: InteractionReplyCallback): InteractionAdmissionResult {
      if (typeof reply !== 'function') return { status: 'rejected', reason: 'invalid-form' };
      if (hasUnsupportedTimeout(form)) return { status: 'rejected', reason: 'unsupported-timeout' };
      if (!validForm(form)) return { status: 'rejected', reason: 'invalid-form' };
      if (disposed || !accepting) {
        deliverUnadmitted(reply, { kind: 'cancel', reason: 'unavailable' });
        return { status: 'rejected', reason: disposed ? 'closed' : errorCode ? 'blocked' : 'closed' };
      }

      let receivedAt: number | undefined;
      if (form.timeoutMs !== undefined) {
        receivedAt = readNow();
        if (receivedAt === undefined) {
          fail('clock-failed');
          deliverUnadmitted(reply, { kind: 'cancel', reason: 'unavailable' });
          return { status: 'rejected', reason: 'blocked' };
        }
      }
      if (active && queue.length >= maxOutstandingForms - 1) {
        const overflowAt = readNow();
        if (overflowAt === undefined) {
          fail('clock-failed');
          deliverUnadmitted(reply, { kind: 'cancel', reason: 'unavailable' });
          return { status: 'rejected', reason: 'blocked' };
        }
        while (overflowTimes.length && overflowTimes[0]! <= overflowAt - 10_000) overflowTimes.shift();
        overflowTimes.push(overflowAt);
        if (overflowTimes.length >= 5) {
          errorCode = 'overflow-burst';
          accepting = false;
          closeReason = 'overflow-barrier';
          currentView = null;
          const { entries, timerFailed } = detachAll();
          if (timerFailed) errorCode = 'timer-failed';
          publish();
          for (const entry of entries) void deliver(entry, { kind: 'cancel', reason: 'overflow-barrier' });
        }
        deliverUnadmitted(reply, { kind: 'cancel', reason: 'overflow' });
        return { status: 'rejected', reason: 'overflow' };
      }

      if (nextId >= Number.MAX_SAFE_INTEGER) {
        fail('identifier-exhausted');
        deliverUnadmitted(reply, { kind: 'cancel', reason: 'unavailable' });
        return { status: 'rejected', reason: 'blocked' };
      }
      const id = `interaction-${nextId}`;
      const localCutoffAt = form.timeoutMs === undefined ? undefined : receivedAt! + form.timeoutMs;
      if (localCutoffAt !== undefined && !Number.isFinite(localCutoffAt)) {
        fail('clock-failed');
        deliverUnadmitted(reply, { kind: 'cancel', reason: 'unavailable' });
        return { status: 'rejected', reason: 'blocked' };
      }
      const projected = projectForm(id, form, localCutoffAt);
      let frameBytes: number;
      try { frameBytes = utf8Bytes(JSON.stringify(projected)); }
      catch { return { status: 'rejected', reason: 'invalid-form' }; }
      if (frameBytes > maxFrameBytes) return { status: 'rejected', reason: 'invalid-form' };

      nextId += 1;
      const entry: Entry = { id, form: projected, reply, replyAttempted: false, live: true };
      if (active) queue.push(entry);
      else active = entry;
      if (!scheduleEntry(entry)) return { status: 'rejected', reason: 'blocked' };
      publish();
      return { status: 'admitted', id };
    },
    answer(view, id, answer): InteractionActionResult {
      if (disposed) return { status: 'rejected', reason: 'disposed' };
      if (!validView(view) || !currentView || view.viewId !== currentView.viewId || view.generation !== currentView.generation) return { status: 'rejected', reason: 'stale-view' };
      if (!accepting) return { status: 'rejected', reason: 'closed' };
      if (!active || active.id !== id) return { status: 'rejected', reason: 'not-active' };
      if (!isAnswerFor(active.form, answer)) return { status: 'rejected', reason: 'invalid-answer' };
      if (expireIfDue(active)) return { status: 'rejected', reason: accepting ? 'not-active' : 'closed' };
      return finish(active, { kind: 'answer', answer: copyAnswer(answer) })
        ? { status: 'applied' } : { status: 'rejected', reason: 'closed' };
    },
    cancel(view, id): InteractionActionResult {
      if (disposed) return { status: 'rejected', reason: 'disposed' };
      if (!validView(view) || !currentView || view.viewId !== currentView.viewId || view.generation !== currentView.generation) return { status: 'rejected', reason: 'stale-view' };
      if (!accepting) return { status: 'rejected', reason: 'closed' };
      if (!active || active.id !== id) return { status: 'rejected', reason: 'not-active' };
      if (expireIfDue(active)) return { status: 'rejected', reason: accepting ? 'not-active' : 'closed' };
      return finish(active, { kind: 'cancel', reason: 'user' })
        ? { status: 'applied' } : { status: 'rejected', reason: 'closed' };
    },
    async stop() {
      if (disposed) return;
      accepting = false;
      closeReason = 'stop';
      currentView = null;
      lifecycleRevision += 1;
      await runLifecycle(() => cancelAll('stop'));
    },
    async reset(view) {
      if (disposed || !validView(view)) return false;
      const revision = ++lifecycleRevision;
      accepting = false;
      closeReason = 'reset';
      currentView = null;
      errorCode = null;
      overflowTimes.length = 0;
      await runLifecycle(() => cancelAll('reset'));
      if (disposed || revision !== lifecycleRevision || errorCode) return false;
      currentView = { ...view };
      closeReason = 'unavailable';
      accepting = true;
      publish();
      return true;
    },
    async dispose() {
      if (disposed) return;
      disposed = true;
      accepting = false;
      closeReason = 'dispose';
      currentView = null;
      lifecycleRevision += 1;
      await runLifecycle(() => cancelAll('dispose'));
      listeners.clear();
    },
  };
}
