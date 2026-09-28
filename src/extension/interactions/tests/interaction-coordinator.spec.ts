import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInteractionCoordinator } from '../index.js';

function manualTime(start = 0) {
  let current = start;
  let nextHandle = 1;
  const scheduled = new Map<number, { at: number; callback: () => void }>();
  return {
    clock: { now: () => current },
    timer: {
      setTimeout(callback: () => void, delayMs: number) {
        const handle = nextHandle++;
        scheduled.set(handle, { at: current + delayMs, callback });
        return handle;
      },
      clearTimeout(handle: unknown) { scheduled.delete(handle as number); },
    },
    pendingCount() { return scheduled.size; },
    advance(milliseconds: number) {
      const target = current + milliseconds;
      for (;;) {
        const due = [...scheduled.entries()]
          .filter(([, item]) => item.at <= target)
          .sort((left, right) => left[1].at - right[1].at || left[0] - right[0])[0];
        if (!due) break;
        scheduled.delete(due[0]);
        current = due[1].at;
        due[1].callback();
      }
      current = target;
    },
  };
}
test('an admitted confirmation is projected as the active trusted extension interaction', async () => {
  const coordinator = createInteractionCoordinator();
  try {
    assert.equal(coordinator.bindView({ viewId: 'view-a', generation: 1 }), true);
    const admission = coordinator.admit(
      { method: 'confirm', title: 'Replace prompt', message: 'Use this prompt?' },
      () => undefined,
    );

    assert.deepEqual(admission, { status: 'admitted', id: 'interaction-1' });
    assert.deepEqual(coordinator.snapshot(), {
      active: {
        id: 'interaction-1',
        method: 'confirm',
        title: 'Replace prompt',
        origin: 'trusted runtime extension; not authenticated',
        message: 'Use this prompt?',
      },
      queuedCount: 0,
      phase: 'waiting',
      errorCode: null,
    });
  } finally {
    await coordinator.dispose();
  }
});

test('the coordinator keeps one active and seven FIFO forms and cancels the overflow newcomer', async () => {
  const coordinator = createInteractionCoordinator();
  const view = { viewId: 'view-a', generation: 1 };
  const replies: Array<Array<{ kind: string; reason?: string }>> = [];
  coordinator.bindView(view);
  try {
    for (let index = 0; index < 8; index += 1) {
      const calls: Array<{ kind: string; reason?: string }> = [];
      replies.push(calls);
      assert.equal(coordinator.admit(
        { method: 'confirm', title: `Form ${index}`, message: `Continue ${index}?` },
        result => { calls.push(result); },
      ).status, 'admitted');
    }
    const overflowCalls: Array<{ kind: string; reason?: string }> = [];
    replies.push(overflowCalls);
    assert.deepEqual(coordinator.admit(
      { method: 'confirm', title: 'Ninth', message: 'Continue?' },
      result => { overflowCalls.push(result); },
    ), { status: 'rejected', reason: 'overflow' });

    assert.equal(coordinator.snapshot().active?.id, 'interaction-1');
    assert.equal(coordinator.snapshot().queuedCount, 7);
    assert.deepEqual(overflowCalls, [{ kind: 'cancel', reason: 'overflow' }]);
    assert.deepEqual(coordinator.cancel(view, 'interaction-1'), { status: 'applied' });
    assert.equal(coordinator.snapshot().active?.id, 'interaction-2');
    assert.equal(coordinator.snapshot().queuedCount, 6);
    assert.deepEqual(replies[0], [{ kind: 'cancel', reason: 'user' }]);
  } finally {
    await coordinator.stop();
    await coordinator.dispose();
  }
});

test('only the current view can answer an active form with its exact method and option', async () => {
  const coordinator = createInteractionCoordinator();
  const firstView = { viewId: 'view-a', generation: 4 };
  const recreatedView = { viewId: 'view-b', generation: 4 };
  const replies: unknown[] = [];
  coordinator.bindView(firstView);
  const admission = coordinator.admit({
    method: 'select',
    title: 'Choose a prompt',
    options: [{ id: 'option-a', label: 'A' }, { id: 'option-b', label: 'B' }],
  }, reply => { replies.push(reply); });
  assert.equal(admission.status, 'admitted');
  if (admission.status !== 'admitted') return;

  try {
    assert.deepEqual(coordinator.answer(recreatedView, admission.id, { method: 'select', optionId: 'option-a' }),
      { status: 'rejected', reason: 'stale-view' });
    assert.equal(coordinator.bindView(recreatedView), true);
    assert.deepEqual(coordinator.answer(firstView, admission.id, { method: 'select', optionId: 'option-a' }),
      { status: 'rejected', reason: 'stale-view' });
    assert.deepEqual(coordinator.answer(recreatedView, admission.id, { method: 'confirm', value: true }),
      { status: 'rejected', reason: 'invalid-answer' });
    assert.deepEqual(coordinator.answer(recreatedView, admission.id, { method: 'select', optionId: 'missing' }),
      { status: 'rejected', reason: 'invalid-answer' });
    assert.equal(coordinator.snapshot().active?.id, admission.id);
    assert.deepEqual(coordinator.answer(recreatedView, admission.id, { method: 'select', optionId: 'option-b' }),
      { status: 'applied' });
    assert.deepEqual(replies, [{ kind: 'answer', answer: { method: 'select', optionId: 'option-b' } }]);
    assert.deepEqual(coordinator.answer(recreatedView, admission.id, { method: 'select', optionId: 'option-b' }),
      { status: 'rejected', reason: 'not-active' });
    assert.equal(replies.length, 1);
  } finally {
    await coordinator.dispose();
  }
});


test('five overflow requests in ten seconds cancel the ledger and hold an admission barrier', async () => {
  let now = 1000;
  const coordinator = createInteractionCoordinator({ clock: { now: () => now } });
  const replyCalls: Array<Array<{ kind: string; reason?: string }>> = [];
  try {
    for (let index = 0; index < 8; index += 1) {
      const calls: Array<{ kind: string; reason?: string }> = [];
      replyCalls.push(calls);
      assert.equal(coordinator.admit(
        { method: 'input', title: `Input ${index}` },
        result => { calls.push(result); },
      ).status, 'admitted');
    }
    for (let index = 0; index < 5; index += 1) {
      now += 1000;
      const calls: Array<{ kind: string; reason?: string }> = [];
      replyCalls.push(calls);
      assert.deepEqual(coordinator.admit(
        { method: 'confirm', title: `Overflow ${index}`, message: 'Busy?' },
        result => { calls.push(result); },
      ), { status: 'rejected', reason: 'overflow' });
    }

    assert.deepEqual(coordinator.snapshot(), {
      active: null,
      queuedCount: 0,
      phase: 'blocked',
      errorCode: 'overflow-burst',
    });
    assert.deepEqual(replyCalls[0], [{ kind: 'cancel', reason: 'overflow-barrier' }]);
    assert.deepEqual(replyCalls[7], [{ kind: 'cancel', reason: 'overflow-barrier' }]);
    for (const calls of replyCalls.slice(8)) assert.deepEqual(calls, [{ kind: 'cancel', reason: 'overflow' }]);
    assert.deepEqual(coordinator.admit(
      { method: 'confirm', title: 'After barrier', message: 'Still blocked?' },
      () => undefined,
    ), { status: 'rejected', reason: 'blocked' });
  } finally {
    await coordinator.dispose();
  }
});

test('a queued peer cutoff expires locally without disturbing the active form', async () => {
  const time = manualTime(1000);
  const coordinator = createInteractionCoordinator({ clock: time.clock, timer: time.timer });
  const view = { viewId: 'view-a', generation: 1 };
  const activeReplies: unknown[] = [];
  const queuedReplies: unknown[] = [];
  coordinator.bindView(view);
  const active = coordinator.admit(
    { method: 'confirm', title: 'No peer timeout', message: 'Still waiting?' },
    reply => { activeReplies.push(reply); },
  );
  const queued = coordinator.admit(
    { method: 'input', title: 'Short peer timeout', timeoutMs: 50 },
    reply => { queuedReplies.push(reply); },
  );
  assert.equal(active.status, 'admitted');
  assert.equal(queued.status, 'admitted');

  try {
    time.advance(50);
    assert.deepEqual(queuedReplies, [{ kind: 'cancel', reason: 'local-cutoff' }]);
    assert.equal(coordinator.snapshot().active?.id, 'interaction-1');
    assert.equal(coordinator.snapshot().queuedCount, 0);
    assert.deepEqual(activeReplies, []);
    if (active.status !== 'admitted') return;
    assert.deepEqual(coordinator.cancel(view, active.id), { status: 'applied' });
    assert.deepEqual(activeReplies, [{ kind: 'cancel', reason: 'user' }]);
  } finally {
    await coordinator.dispose();
  }
});

test('reset waits for Stop cancellation writes before reopening admission', async () => {
  const coordinator = createInteractionCoordinator();
  const view = { viewId: 'view-a', generation: 1 };
  let releaseStopReply: (() => void) | undefined;
  let stopReplyStarted = false;
  coordinator.bindView(view);
  coordinator.admit(
    { method: 'confirm', title: 'Before Stop', message: 'Done?' },
    () => {
      stopReplyStarted = true;
      return new Promise<void>(resolve => { releaseStopReply = resolve; });
    },
  );

  try {
    const stopping = coordinator.stop();
    assert.equal(stopReplyStarted, true);
    let resetFinished = false;
    const resetting = coordinator.reset({ viewId: 'view-b', generation: 2 }).then(result => {
      resetFinished = true;
      return result;
    });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(resetFinished, false);
    assert.deepEqual(coordinator.admit(
      { method: 'input', title: 'During cleanup' },
      () => undefined,
    ), { status: 'rejected', reason: 'closed' });
    releaseStopReply?.();
    await stopping;
    assert.equal(await resetting, true);
    assert.equal(coordinator.bindView({ viewId: 'view-b', generation: 2 }), true);
    assert.equal(coordinator.admit(
      { method: 'input', title: 'After reset' },
      () => undefined,
    ).status, 'admitted');
  } finally {
    releaseStopReply?.();
    await coordinator.dispose();
  }
});


test('all standard methods preserve empty values and have no blanket human timeout', async () => {
  const time = manualTime(5000);
  const coordinator = createInteractionCoordinator({ clock: time.clock, timer: time.timer });
  const view = { viewId: 'view-a', generation: 1 };
  const replies: unknown[] = [];
  coordinator.bindView(view);
  try {
    const confirm = coordinator.admit(
      { method: 'confirm', title: 'Continue', message: '' },
      reply => { replies.push(reply); },
    );
    assert.equal(confirm.status, 'admitted');
    assert.equal(coordinator.snapshot().active?.method, 'confirm');
    assert.equal(coordinator.snapshot().active?.localCutoffAt, undefined);
    assert.equal(time.pendingCount(), 0);
    assert.deepEqual(coordinator.answer(view, 'interaction-1', { method: 'confirm', value: false }), { status: 'applied' });

    const input = coordinator.admit(
      { method: 'input', title: 'Name', placeholder: '' },
      reply => { replies.push(reply); },
    );
    assert.equal(input.status, 'admitted');
    assert.deepEqual(coordinator.snapshot().active, {
      id: 'interaction-2', method: 'input', title: 'Name', origin: 'trusted runtime extension; not authenticated', placeholder: '',
    });
    assert.deepEqual(coordinator.answer(view, 'interaction-2', { method: 'input', text: '' }), { status: 'applied' });

    const editor = coordinator.admit(
      { method: 'editor', title: 'Edit', prefill: '' },
      reply => { replies.push(reply); },
    );
    assert.equal(editor.status, 'admitted');
    assert.deepEqual(coordinator.snapshot().active, {
      id: 'interaction-3', method: 'editor', title: 'Edit', origin: 'trusted runtime extension; not authenticated', prefill: '',
    });
    assert.deepEqual(coordinator.answer(view, 'interaction-3', { method: 'editor', text: '' }), { status: 'applied' });
    assert.deepEqual(replies, [
      { kind: 'answer', answer: { method: 'confirm', value: false } },
      { kind: 'answer', answer: { method: 'input', text: '' } },
      { kind: 'answer', answer: { method: 'editor', text: '' } },
    ]);
  } finally {
    await coordinator.dispose();
  }
});

test('peer cutoff remains based on receipt time through view rebind and FIFO promotion', async () => {
  const time = manualTime(2000);
  const coordinator = createInteractionCoordinator({ clock: time.clock, timer: time.timer });
  const firstView = { viewId: 'view-a', generation: 1 };
  const secondView = { viewId: 'view-b', generation: 2 };
  const expiredReplies: unknown[] = [];
  coordinator.bindView(firstView);
  try {
    coordinator.admit({ method: 'confirm', title: 'Active', message: 'Wait?' }, () => undefined);
    const queued = coordinator.admit(
      { method: 'input', title: 'Queued', timeoutMs: 50 },
      reply => { expiredReplies.push(reply); },
    );
    assert.equal(queued.status, 'admitted');
    time.advance(30);
    assert.equal(coordinator.bindView(secondView), true);
    assert.deepEqual(coordinator.cancel(firstView, 'interaction-1'), { status: 'rejected', reason: 'stale-view' });
    assert.deepEqual(coordinator.cancel(secondView, 'interaction-1'), { status: 'applied' });
    assert.equal(coordinator.snapshot().active?.id, 'interaction-2');
    assert.equal(coordinator.snapshot().active?.localCutoffAt, 2050);
    time.advance(19);
    assert.equal(coordinator.snapshot().active?.id, 'interaction-2');
    time.advance(1);
    assert.equal(coordinator.snapshot().active, null);
    assert.deepEqual(expiredReplies, [{ kind: 'cancel', reason: 'local-cutoff' }]);
  } finally {
    await coordinator.dispose();
  }
});

test('malformed forms and unsupported peer timeouts do not consume host IDs or call reply capabilities', async () => {
  const coordinator = createInteractionCoordinator();
  const replyEffects: unknown[] = [];
  try {
    const badForms = [
      { method: 'confirm', title: 'x'.repeat(513), message: 'Too long title' },
      { method: 'confirm', title: 'Long answer field', message: 'x'.repeat(32_769) },
      { method: 'input', title: 'Extra field', command: 'not allowed' },
      { method: 'select', title: 'Too many options', options: Array.from({ length: 65 }, (_, index) => ({ id: `option-${index}`, label: 'x' })) },
      { method: 'select', title: 'Duplicate option IDs', options: [{ id: 'same', label: 'One' }, { id: 'same', label: 'Two' }] },
      { method: 'select', title: 'Long option label', options: [{ id: 'large', label: 'x'.repeat(1_025) }] },
      { method: 'confirm', title: 'Control bytes', message: '\u0000'.repeat(12_000) },
    ] as const;
    for (const form of badForms) {
      assert.deepEqual(coordinator.admit(form as never, reply => { replyEffects.push(reply); }),
        { status: 'rejected', reason: 'invalid-form' });
    }
    assert.deepEqual(coordinator.admit(
      { method: 'confirm', title: 'Unsupported peer timer', message: 'No clamp', timeoutMs: 86_400_001 },
      reply => { replyEffects.push(reply); },
    ), { status: 'rejected', reason: 'unsupported-timeout' });
    assert.deepEqual(coordinator.admit(
      { method: 'confirm', title: 'Valid after invalid', message: 'Still first?' },
      reply => { replyEffects.push(reply); },
    ), { status: 'admitted', id: 'interaction-1' });
    assert.deepEqual(replyEffects, []);
  } finally {
    await coordinator.dispose();
  }
});


test('a rejected reply blocks safely, never retries, and cancels the remaining ledger', async () => {
  const coordinator = createInteractionCoordinator();
  const view = { viewId: 'view-a', generation: 1 };
  let firstAttempts = 0;
  const queuedReplies: unknown[] = [];
  coordinator.bindView(view);
  try {
    coordinator.admit({ method: 'confirm', title: 'Answer', message: 'Reply may fail?' }, () => {
      firstAttempts += 1;
      return Promise.reject(new Error('sensitive adapter detail'));
    });
    coordinator.admit({ method: 'input', title: 'Queued' }, reply => { queuedReplies.push(reply); });

    assert.deepEqual(coordinator.answer(view, 'interaction-1', { method: 'confirm', value: true }), { status: 'applied' });
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(firstAttempts, 1);
    assert.deepEqual(coordinator.snapshot(), {
      active: null, queuedCount: 0, phase: 'blocked', errorCode: 'reply-failed',
    });
    assert.deepEqual(queuedReplies, [{ kind: 'cancel', reason: 'unavailable' }]);
    assert.deepEqual(coordinator.admit(
      { method: 'confirm', title: 'Blocked', message: 'Must not retry' },
      () => undefined,
    ), { status: 'rejected', reason: 'blocked' });
  } finally {
    await coordinator.dispose();
  }
});

test('Stop closes admission before cancellation callbacks can re-enter the coordinator', async () => {
  const coordinator = createInteractionCoordinator();
  const view = { viewId: 'view-a', generation: 1 };
  const firstReplies: unknown[] = [];
  const reentrantReplies: unknown[] = [];
  let reentrantAdmission: unknown;
  coordinator.bindView(view);
  coordinator.admit({ method: 'confirm', title: 'Stop', message: 'Cancel me' }, reply => {
    firstReplies.push(reply);
    reentrantAdmission = coordinator.admit(
      { method: 'input', title: 'Cancellation-triggered form' },
      nextReply => { reentrantReplies.push(nextReply); },
    );
  });

  try {
    await coordinator.stop();
    assert.deepEqual(firstReplies, [{ kind: 'cancel', reason: 'stop' }]);
    assert.deepEqual(reentrantAdmission, { status: 'rejected', reason: 'closed' });
    assert.deepEqual(reentrantReplies, [{ kind: 'cancel', reason: 'unavailable' }]);
    assert.deepEqual(coordinator.snapshot(), { active: null, queuedCount: 0, phase: 'blocked', errorCode: null });
    assert.equal(coordinator.answer(view, 'interaction-1', { method: 'confirm', value: true }).status, 'rejected');

    assert.equal(await coordinator.reset({ viewId: 'view-b', generation: 2 }), true);
    assert.equal(coordinator.admit({ method: 'confirm', title: 'Fresh', message: 'Ready?' }, () => undefined).status, 'admitted');
    assert.equal(firstReplies.length, 1);
  } finally {
    await coordinator.dispose();
  }
});

test('answer and disposal release peer timers and disposal is idempotent', async () => {
  const time = manualTime(100);
  const coordinator = createInteractionCoordinator({ clock: time.clock, timer: time.timer });
  const view = { viewId: 'view-a', generation: 1 };
  coordinator.bindView(view);
  try {
    coordinator.admit({ method: 'input', title: 'Timed', timeoutMs: 500 }, () => undefined);
    assert.equal(time.pendingCount(), 1);
    assert.deepEqual(coordinator.answer(view, 'interaction-1', { method: 'input', text: 'done' }), { status: 'applied' });
    assert.equal(time.pendingCount(), 0);

    coordinator.admit({ method: 'editor', title: 'Dispose pending', timeoutMs: 500 }, () => undefined);
    assert.equal(time.pendingCount(), 1);
    await coordinator.dispose();
    assert.equal(time.pendingCount(), 0);
    await coordinator.dispose();
    assert.deepEqual(coordinator.admit({ method: 'confirm', title: 'Disposed', message: 'No' }, () => undefined),
      { status: 'rejected', reason: 'closed' });
  } finally {
    await coordinator.dispose();
  }
});


test('a failed disposal cancellation exposes only the fixed reply failure code', async () => {
  const coordinator = createInteractionCoordinator();
  coordinator.admit({ method: 'confirm', title: 'Dispose', message: 'Cancel?' }, () =>
    Promise.reject(new Error('never project this exception')),
  );
  await coordinator.dispose();
  await Promise.resolve();
  assert.deepEqual(coordinator.snapshot(), {
    active: null, queuedCount: 0, phase: 'blocked', errorCode: 'reply-failed',
  });
});

test('Stop re-entered during projection suppresses an affirmative reply not yet attempted', async () => {
  const coordinator = createInteractionCoordinator();
  const view = { viewId: 'view-a', generation: 1 };
  const firstReplies: unknown[] = [];
  const secondReplies: unknown[] = [];
  let stopStarted = false;
  let stopping: Promise<void> = Promise.resolve();
  const unsubscribe = coordinator.subscribe(snapshot => {
    if (!stopStarted && snapshot.active?.id === 'interaction-2') {
      stopStarted = true;
      stopping = coordinator.stop();
    }
  });
  coordinator.bindView(view);
  coordinator.admit({ method: 'confirm', title: 'First', message: 'Answer?' }, reply => { firstReplies.push(reply); });
  coordinator.admit({ method: 'input', title: 'Queued second' }, reply => { secondReplies.push(reply); });
  try {
    assert.deepEqual(coordinator.answer(view, 'interaction-1', { method: 'confirm', value: true }),
      { status: 'rejected', reason: 'closed' });
    await stopping;
    assert.deepEqual(firstReplies, [{ kind: 'cancel', reason: 'stop' }]);
    assert.deepEqual(secondReplies, [{ kind: 'cancel', reason: 'stop' }]);
    assert.deepEqual(coordinator.snapshot(), { active: null, queuedCount: 0, phase: 'blocked', errorCode: null });
  } finally {
    unsubscribe();
    await coordinator.dispose();
  }
});

test('late reply failure from a retired runtime cannot block its replacement', async () => {
  const coordinator = createInteractionCoordinator();
  let reject!: (error: Error) => void;
  const view = { viewId: 'old', generation: 1 };
  coordinator.bindView(view);
  const admission = coordinator.admit({ method: 'input', title: 'Old' }, () => new Promise<void>((_resolve, fail) => { reject = fail; }));
  assert.equal(admission.status, 'admitted');
  if (admission.status !== 'admitted') return;
  coordinator.answer(view, admission.id, { method: 'input', text: 'once' });
  assert.equal(await coordinator.reset({ viewId: 'new', generation: 2 }), true);
  reject(new Error('old pipe closed')); await Promise.resolve(); await Promise.resolve();
  assert.equal(coordinator.snapshot().phase, 'idle');
  await coordinator.dispose();
});
