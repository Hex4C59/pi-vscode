import assert from "node:assert/strict";
import test from "node:test";
import type { ApprovalCard } from "../../extension/contracts/index.js";
import { candidateHarness } from "./candidate-harness.js";
import { uiHarness } from "./react-harness.js";

function cards(): ApprovalCard[] {
  return Array.from({ length: 8 }, (_, i) => ({ id: `approval-${i}`, toolCallId: `tool-${i}`, tool: "bash",
    input: JSON.stringify({ command: `echo request-${i} <literal>`, cwd: "/workspace" }),
    scope: i === 7 ? null : `["bash","/workspace","echo request-${i} <literal>"]`, expiresAt: Date.now() + 120000 }));
}

test("candidate selects one of eight pending approvals without authorizing another request", async () => {
  const h = await uiHarness(true, true);
  try {
    const pending = cards();
    await h.render({ approvals: pending, chatBusy: true, execution: "awaiting-approval" });
    assert.match(h.get('[aria-label="Pending approvals"]').textContent ?? "", /8/);
    assert.equal(h.root.querySelectorAll('.approval:not([hidden])').length, 1);
    assert.equal(h.get('.approval:not([hidden])').getAttribute('data-approval-id'), "approval-0");
    await h.click('[data-select-approval="approval-7"]');
    assert.equal(h.sent.filter(m => m.type === "decideApproval").length, 0);
    assert.equal(h.get('.approval:not([hidden]) .approval-input').textContent, pending[7].input);
    assert.equal(h.get<HTMLButtonElement>('.approval:not([hidden]) [data-decision="session"]').disabled, true);
    await h.click('[data-select-approval="approval-2"]');
    await h.click('.approval:not([hidden]) [data-decision="once"]');
    assert.deepEqual(h.sent.at(-1), {version: 3, type: "decideApproval", viewId: "view", generation: 1, id: "approval-2", decision: "once"});
    await h.click('[data-select-approval="approval-3"]');
    await h.click('[data-select-approval="approval-2"]');
    assert.equal(h.get<HTMLButtonElement>('.approval:not([hidden]) [data-decision="deny"]').disabled, true);
  } finally { await h.close(); }
});

test("candidate replacement moves focus off a lost decision but does not steal focus from a newer draft", async () => {
  const h = await uiHarness(true, true);
  try {
    const pending = cards();
    await h.render({ approvals: pending, chatBusy: true, execution: "awaiting-approval" });
    h.get<HTMLButtonElement>('.approval:not([hidden]) [data-decision="once"]').focus();
    await h.render({ approvals: pending.slice(1), chatBusy: true, execution: "awaiting-approval" });
    assert.equal(h.dom.window.document.activeElement === h.get('[data-select-approval="approval-1"]'), true);
    assert.equal(h.sent.filter(m => m.type === "decideApproval").length, 0);
    h.get<HTMLButtonElement>('.approval:not([hidden]) [data-decision="once"]').focus();
    const input = h.get<HTMLTextAreaElement>('textarea[aria-label="Message"]');
    input.focus();
    await h.render({ approvals: pending.slice(2), chatBusy: true, execution: "awaiting-approval" });
    assert.equal(h.dom.window.document.activeElement === input, true);
  } finally { await h.close(); }
});

test("candidate expiry selects the next live request and Stop locks all decisions and revocation", async t => {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 1000 });
  const h = await uiHarness(true, true);
  try {
    const pending = cards(); pending[0].expiresAt = 1100;
    await h.render({ approvals: pending, grants: [{id: "grant", scope: "exact complete command"}], chatBusy: true, execution: "awaiting-approval" });
    h.get<HTMLButtonElement>('.approval:not([hidden]) [data-decision="once"]').focus();
    const { act } = await import("react");
    await act(async () => t.mock.timers.tick(101));
    assert.equal(h.get('.approval:not([hidden])').getAttribute("data-approval-id"), "approval-1");
    assert.equal(h.dom.window.document.activeElement === h.get('[data-select-approval="approval-1"]'), true);
    assert.equal(h.sent.filter(m => m.type === "decideApproval").length, 0);
    await h.render({ approvals: pending, grants: [{id: "grant", scope: "exact complete command"}], chatBusy: true, execution: "stopping" });
    assert.equal(h.get<HTMLButtonElement>('.approval:not([hidden]) [data-decision="once"]').disabled, true);
    assert.equal(h.get<HTMLButtonElement>('[data-grant-action="revoke"]').disabled, true);
    await h.click('.approval:not([hidden]) [data-decision="once"]');
    assert.equal(h.sent.filter(m => m.type === "decideApproval").length, 0);
  } finally { await h.close(); }
});

test("synthetic queue decisions remove only their own request and exact grants can be revoked", async t => {
  const h = await candidateHarness(t, "approval-queue");
  const pendingIds = () => [...h.root.querySelectorAll('[data-select-approval]')].map(button => button.getAttribute('data-select-approval'));
  assert.deepEqual(pendingIds(), Array.from({length:8}, (_, index) => `approval-preview-${index + 1}`));
  await h.click('[data-select-approval="approval-preview-2"]');
  await h.click('.approval:not([hidden]) [data-decision="session"]');
  assert.deepEqual(pendingIds(), ["approval-preview-1", ...Array.from({length:6}, (_, index) => `approval-preview-${index + 3}`)]);
  assert.match(h.root.querySelector('[data-grant-id] pre')?.textContent ?? "", /request-2/);
  await h.click('[data-grant-action="revoke"]');
  assert.equal(h.root.querySelectorAll('[data-grant-id]').length,0);
  await h.click('[data-select-approval="approval-preview-3"]');
  await h.click('.approval:not([hidden]) [data-decision="deny"]');
  assert.deepEqual(pendingIds(), ["approval-preview-1", ...Array.from({length:5}, (_, index) => `approval-preview-${index + 4}`)]);
  await h.click('button[aria-label="Stop current task"]');
  assert.deepEqual(pendingIds(), []);
});

test("candidate keeps file targets and exact scope visible outside expandable large input", async () => {
  const h = await uiHarness(true, true);
  try {
    const card = { ...cards()[0], tool: "write", input: JSON.stringify({content:"<script>literal</script>".repeat(400), path:"src/important.ts"}), scope:'["write","/workspace/src/important.ts"]' };
    await h.render({approvals:[card],chatBusy:true,execution:"awaiting-approval"});
    assert.equal(h.get('.approval-target').textContent, 'src/important.ts');
    const scope = h.get('.approval .grant-scope');
    assert.equal(scope.closest('details'),null);
    const details = h.get<HTMLDetailsElement>('.approval details');
    assert.equal(details.open,false);
    await h.click('.approval details > summary');
    assert.equal(details.open,true);
    assert.equal(h.get('.approval-input').textContent,card.input);
    assert.equal(h.get('.approval-input').querySelector('script') === null, true);
  } finally {await h.close();}
});

test("candidate always exposes controlled permissions in the composer and revokes exact grants there", async () => {
  const h = await uiHarness(true, true);
  try {
    const permissions = h.get<HTMLDetailsElement>('.candidate__composer .candidate-permissions');
    await h.click('.candidate-permissions > summary');
    assert.equal(permissions.open,true);
    assert.match(permissions.textContent ?? "", /Controlled execution.*not a sandbox/s);
    await h.render({grants:[{id:"scope-grant",scope:'["bash","/workspace","echo complete command"]'}]});
    assert.equal(h.get('[data-grant-id] .grant-scope').textContent,'["bash","/workspace","echo complete command"]');
    await h.click('[data-grant-action="revoke"]');
    assert.deepEqual(h.sent.at(-1), {version:3,type:"revokeGrant",viewId:"view",generation:1,id:"scope-grant"});
  } finally {await h.close();}
});

test("candidate never enables a request that is already expired when its projection arrives", async t => {
  t.mock.timers.enable({apis:["Date","setTimeout"],now:1000});
  const h=await uiHarness(true,true);
  try {
    const pending=cards();pending[0].expiresAt=1100;
    await h.render({approvals:[pending[1]],chatBusy:true,execution:"awaiting-approval"});
    t.mock.timers.tick(500);
    await h.render({approvals:[pending[0]],chatBusy:true,execution:"awaiting-approval"});
    assert.equal(h.root.querySelectorAll('[data-select-approval]').length,0);
    assert.equal(h.get<HTMLButtonElement>('[data-decision="once"]').disabled,true);
  } finally {await h.close();}
});

test("a new synthetic approval queue is not erased by the previous queue's late continuation", async t => {
  const h=await candidateHarness(t,"approval-queue");
  for(let index=0;index<8;index++)await h.click('.approval:not([hidden]) [data-decision="once"]');
  await h.queueApprovals();
  const pendingIds = () => [...h.root.querySelectorAll('[data-select-approval]')].map(button => button.getAttribute('data-select-approval'));
  const replacementIds = Array.from({length:8}, (_, index) => `approval-synthetic-1-${index + 1}`);
  assert.deepEqual(pendingIds(), replacementIds);
  await h.advance(360);
  assert.deepEqual(pendingIds(), replacementIds);
  assert.ok(h.root.querySelector('button[aria-label="Stop current task"]'));
});

test("custom tool approval discloses limited coverage and never offers a usable session grant", async () => {
  const h = await uiHarness(true, true);
  try {
    const card: ApprovalCard = { id: "custom", toolCallId: "custom-call", tool: "review_summary", category: "custom", input: '{"query":"literal <script>"}', scope: null, expiresAt: Date.now() + 120000 };
    await h.render({ approvals: [card], chatBusy: true, execution: "awaiting-approval" });
    assert.match(h.get('.approval:not([hidden])').textContent ?? "", /Custom extension tool/);
    assert.match(h.get('.approval:not([hidden])').textContent ?? "", /outside this approval/);
    assert.equal(h.get<HTMLButtonElement>('.approval:not([hidden]) [data-decision="session"]').disabled, true);
    assert.equal(h.get('.approval-input').textContent, card.input);
    assert.equal(h.root.querySelector('script') === null, true);
    await h.click('.approval:not([hidden]) [data-decision="once"]');
    assert.deepEqual(h.sent.at(-1), {version: 3, type: "decideApproval", viewId: "view", generation: 1, id: "custom", decision: "once"});
  } finally { await h.close(); }
});

test("compact custom coverage warning shares scrollable details rather than shrinking literal input", async () => {
  const h = await uiHarness(true, true);
  try {
    await h.render({ approvals: [{ id: "custom-layout", toolCallId: "custom-call", tool: "owned_counter", category: "custom", input: '{"text":"fixed synthetic payload"}', scope: null, expiresAt: Date.now() + 120000 }], chatBusy: true, execution: "awaiting-approval" });
    const warning = h.get(".approval:not([hidden]) .approval-details > .muted");
    assert.match(warning.textContent ?? "", /Custom extension tool/);
    assert.equal(h.root.querySelector(".approval:not([hidden]) > .muted") === null, true);
    assert.equal(h.get<HTMLButtonElement>('[data-decision="session"]').disabled, true);
  } finally { await h.close(); }
});

test("a single pending request renders without the multi-request selector", async () => {
  const h = await uiHarness(true, true);
  try {
    await h.render({ approvals: [cards()[0]], chatBusy: true, execution: "awaiting-approval" });
    assert.equal(h.root.querySelector(".approval-selector") === null, true, "one request needs no selector row");
    assert.equal(h.root.querySelectorAll('.approval:not([hidden])').length, 1);
    await h.render({ approvals: cards().slice(0, 2), chatBusy: true, execution: "awaiting-approval" });
    assert.ok(h.get('[aria-label="Pending approvals"]'), "two requests restore the selector");
    assert.match(h.get('[aria-label="Pending approvals"]').textContent ?? "", /2/);
  } finally { await h.close(); }
});

test("an expired request says so in words instead of only disabling its decisions", async t => {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 1000 });
  const h = await uiHarness(true, true);
  try {
    const expired = { ...cards()[0], expiresAt: 900 };
    await h.render({ approvals: [expired], chatBusy: true, execution: "awaiting-approval" });
    const marker = h.get(".approval-expired");
    assert.equal(marker.getAttribute("role"), "status");
    assert.match(marker.textContent ?? "", /This request has expired\./);
    assert.equal(h.get<HTMLButtonElement>('[data-decision="once"]').disabled, true);
    assert.equal(h.sent.filter(m => m.type === "decideApproval").length, 0);
  } finally { await h.close(); }
});
