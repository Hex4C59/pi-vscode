import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react";
import { uiHarness } from "./react-harness.js";

const review = {version:2,type:"changeReviewState",viewId:"view",generation:1,entries:[{
  id:"review", taskId:"task", path:"src/literal.ts", source:"tool", tool:"write", status:"complete", diff:"ready",
  reason:null, sourceChanged:true, overlap:false,
}],retainedBytes:128,limited:false,reset:false,error:null} as const;

test("candidate language changes translate review controls without translating captured targets", async () => {
  const h=await uiHarness(true,true);
  try {
    await h.receive(review);await h.click('#change-review-toggle');
    await h.click('button[aria-label="Interface settings"]');
    await act(async()=> {const select=h.get<HTMLSelectElement>('.candidate-settings select');select.value="zh-CN";select.dispatchEvent(new h.dom.window.Event("change",{bubbles:true}));});
    assert.match(h.get('#change-review-toggle').textContent ?? "", /审阅修改/);
    assert.match(h.get('[data-review-action="diff"]').textContent ?? "", /查看捕获的差异/);
    assert.equal(h.get('.change-review__path').textContent, 'src/literal.ts');
  } finally {await h.close();}
});

test("candidate reports lost reviews without claiming a diff and ignores obsolete review generations", async () => {
  const h=await uiHarness(true,true);
  try {
    await h.receive(review);
    await h.receive({...review,entries:[],retainedBytes:0,error:"unavailable"});
    assert.match(h.get('.candidate-review__warning').textContent ?? "", /unavailable/);
    assert.equal(h.root.querySelector('[data-review-action="diff"]'),null);
    await h.render({generation:2});
    await h.receive(review);
    assert.equal(h.root.querySelector('[data-candidate-review]'),null);
  } finally {await h.close();}
});

test("candidate composes streaming, catalogue, incoming expiry, captured review and a newer draft", async t => {
  const {candidateHarness}=await import("./candidate-harness.js");
  const h=await candidateHarness(t);
  await h.input("Prepare a synthetic task"); await h.click('button[aria-label="Send message"]');
  await h.advance(400);
  await h.input("Newer draft survives navigation and permission expiry");
  await h.click('button[aria-label="Browse saved conversations"]');await h.advance(80);
  await h.completeReview();
  assert.match(h.get('#change-review-toggle').textContent ?? "", /33/);
  await h.queueApprovals();
  assert.equal(h.root.querySelectorAll('[data-select-approval]').length,8);
  const decision=h.get<HTMLButtonElement>('.approval:not([hidden]) [data-decision="once"]');decision.focus();
  await h.advance(20001);
  assert.equal(h.root.querySelectorAll('[data-select-approval]').length,7);
  assert.equal(h.dom.window.document.activeElement,h.get('[data-select-approval="approval-synthetic-1-2"]'));
  await h.click('button[aria-label="Back to conversation"]');
  assert.equal(h.get<HTMLTextAreaElement>('textarea[aria-label="Message"]').value,"Newer draft survives navigation and permission expiry");
  await h.click('button[aria-label="Stop current task"]');await h.advance(420);
  await h.click('#change-review-toggle');
  assert.match(h.get('.change-review__entry').textContent ?? "", /Tool-reported/);
  await h.loseReview();
  assert.equal(h.root.querySelectorAll('[data-review-action="diff"]').length,0);
  assert.equal(h.get<HTMLTextAreaElement>('textarea[aria-label="Message"]').value,"Newer draft survives navigation and permission expiry");
});

test("short candidate collapses an expanded review when approvals arrive without changing the draft", async () => {
  const h=await uiHarness(true,true);
  try {
    Object.defineProperty(h.dom.window,"innerHeight",{configurable:true,value:500});
    await act(async()=>h.dom.window.dispatchEvent(new h.dom.window.Event("resize")));
    await h.receive(review);await h.click('#change-review-toggle');
    await h.input('Keep short-viewport draft','textarea[aria-label="Message"]');
    assert.equal(h.get('#change-review-toggle').getAttribute('aria-expanded'),'true');
    await h.render({chatBusy:true,execution:"awaiting-approval",approvals:[{id:"approval",toolCallId:"tool",tool:"write",input:'{"path":"src/file.ts"}',scope:null,expiresAt:Date.now()+120000}]});
    assert.equal(h.get('#change-review-toggle').getAttribute('aria-expanded'),'false');
    assert.equal(h.get<HTMLTextAreaElement>('textarea[aria-label="Message"]').value,'Keep short-viewport draft');
  } finally {await h.close();}
});

test("expiry of every synthetic approval settles the admitted attachment history as failed", async t => {
  const {candidateHarness}=await import("./candidate-harness.js");
  const h=await candidateHarness(t);
  await h.input("A synthetic task with explicit context");
  await h.click('button[aria-label="Add context"]');await h.click('[role="menuitem"][aria-label="Add file"]');await h.advance(420);
  await h.click('button[aria-label="Send message"]');await h.advance(400);
  await h.queueApprovals();await h.advance(120001);
  assert.equal(h.root.querySelectorAll('[data-select-approval]').length,0);
  await h.click('button[aria-label="Attachment history"]');
  const history=h.get('[aria-label="Retained attachment history"]');
  assert.match(history.textContent ?? "", /Accepted by runtime.*Task failed/);
  assert.doesNotMatch(history.textContent ?? "", /Task pending/);
});

test("automatic review collapse recovers a hidden review focus but leaves composer focus alone", async () => {
  const h=await uiHarness(true,true);
  try {
    Object.defineProperty(h.dom.window,"innerHeight",{configurable:true,value:500});
    await act(async()=>h.dom.window.dispatchEvent(new h.dom.window.Event("resize")));
    await h.receive(review);await h.click('#change-review-toggle');
    h.get<HTMLButtonElement>('[data-review-action="diff"]').focus();
    const approvals=[{id:"approval",toolCallId:"tool",tool:"write",input:'{"path":"src/file.ts"}',scope:null,expiresAt:Date.now()+120000}];
    await h.render({chatBusy:true,execution:"awaiting-approval",approvals});
    assert.equal(h.dom.window.document.activeElement === h.get('#change-review-toggle'), true, 'hidden review focus returns to its visible entry');
    await h.render();await h.click('#change-review-toggle');
    const input=h.get<HTMLTextAreaElement>('textarea[aria-label="Message"]');input.focus();
    await h.render({chatBusy:true,execution:"awaiting-approval",approvals});
    assert.equal(h.dom.window.document.activeElement,input);
  } finally {await h.close();}
});
