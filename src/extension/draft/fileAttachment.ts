import type * as vscode from "vscode";
import { realpath, stat } from "node:fs/promises";
import path from "node:path";

import type { AttachmentCode, SelectionRange } from "../contracts/index.js";
export type { AttachmentCode } from "../contracts/index.js";
export class AttachmentFailure extends Error {
  constructor(readonly code: AttachmentCode) { super(code); }
}
export type FileSnapshot = {
  document: vscode.TextDocument; uri: vscode.Uri; root: string; target: string; identity: string;
  version: number; unsaved: boolean; text: string; relativePath: string; utf8Bytes: number;
};
const fail = (code: AttachmentCode): never => { throw new AttachmentFailure(code); };
function safePath(value: string): void {
  if (!path.isAbsolute(value) || [...value].some(character => character.charCodeAt(0) < 32) || /^[\\/]{2}/.test(value)
    || value.replace(/^[A-Za-z]:/, "").includes(":")) fail("invalid-source");
  if (value.split(/[\\/]/).some(part => /[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) fail("invalid-source");
}
function sensitivePath(value: string): void {
  if (value.split(/[\\/]/).some(part => /^(?:\.local-env|\.ssh|\.env(?:\..*)?|auth\.json|credentials\.json|id_rsa|id_ed25519)$/i.test(part) || /\.(pem|key|p12|pfx)$/i.test(part))) fail("sensitive-source");
}
async function source(rootPath: string, uri: vscode.Uri, current: () => boolean) {
  if (uri.scheme !== "file" || uri.authority || uri.query || uri.fragment) fail("invalid-source");
  safePath(rootPath); safePath(uri.fsPath); sensitivePath(uri.fsPath);
  const root = await realpath(rootPath); if (!current()) fail("preparation-cancelled");
  const target = await realpath(uri.fsPath); if (!current()) fail("preparation-cancelled");
  safePath(root); safePath(target); sensitivePath(target);
  const relativePath = path.relative(root, target);
  if (!relativePath || relativePath === ".." || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) fail("outside-workspace");
  if (Buffer.byteLength(relativePath, "utf8") > 1024) fail("metadata-too-large");
  const info = await stat(target); if (!current()) fail("preparation-cancelled");
  if (!info.isFile() || !Number.isFinite(info.ino) || info.ino === 0) fail("invalid-source");
  return { root, target, relativePath, size: info.size, identity: JSON.stringify([info.dev, info.ino, info.size, info.mtimeMs, info.ctimeMs]) };
}
function captureText(document: vscode.TextDocument): string {
  if (document.isClosed || document.lineCount < 1) fail("unavailable");
  if (document.offsetAt(document.lineAt(document.lineCount - 1).range.end) > 262144) fail("text-too-large");
  return checkedText(document.getText());
}
function checkedText(text: string): string {
  if (Buffer.byteLength(text, "utf8") > 262144) fail("text-too-large");
  if (/-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/i.test(text)
    || /["']?(?:api[_ -]?key|authorization|password|secret|access[_ -]?token)["']?\s*[:=]\s*["']?[^\s"',;}]+/i.test(text)) fail("sensitive-source");
  return text;
}
export async function captureFile(workspace: Pick<typeof vscode.workspace, "textDocuments" | "openTextDocument">, rootPath: string, uri: vscode.Uri, current: () => boolean): Promise<FileSnapshot> {
  try {
    const before = await source(rootPath, uri, current);
    let document = workspace.textDocuments.find(doc => !doc.isClosed && doc.uri.toString() === uri.toString());
    const alreadyOpen = !!document;
    if (!document) {
      if (before.size > 1048576) fail("source-too-large");
      try { document = await workspace.openTextDocument(uri); } catch { fail("not-text"); }
      if (!current()) fail("preparation-cancelled");
    }
    if (!document) return fail("not-text");
    const text = captureText(document);
    const version = document.version; const unsaved = document.isDirty;
    const after = await source(rootPath, uri, current);
    if ((!alreadyOpen && after.size > 1048576)) fail("source-too-large");
    if (before.identity !== after.identity || before.root !== after.root || before.target !== after.target
      || document.version !== version || document.isDirty !== unsaved || document.isClosed || document.getText() !== text) fail("source-changed");
    return { ...after, document, uri, version, unsaved, text, utf8Bytes: Buffer.byteLength(text, "utf8") };
  } catch (error) { if (error instanceof AttachmentFailure) throw error; return fail("unavailable"); }
}
export function validateEditorSnapshot(snapshot: FileSnapshot, workspace: Pick<typeof vscode.workspace, "textDocuments">): void {
  if (!workspace.textDocuments.includes(snapshot.document) || snapshot.document.isClosed) fail("unavailable");
  if (snapshot.document.version !== snapshot.version || snapshot.document.isDirty !== snapshot.unsaved || captureText(snapshot.document) !== snapshot.text) fail("source-changed");
}

export async function revalidateFile(snapshot: FileSnapshot, workspace: Pick<typeof vscode.workspace, "textDocuments">, root: string, current: () => boolean): Promise<void> {
  try {
    const actual = await source(root, snapshot.uri, current);
    if (actual.root !== snapshot.root || actual.target !== snapshot.target || actual.identity !== snapshot.identity) fail("source-changed");
    if (!workspace.textDocuments.includes(snapshot.document) || snapshot.document.isClosed) fail("unavailable");
    if (snapshot.document.version !== snapshot.version || snapshot.document.isDirty !== snapshot.unsaved || captureText(snapshot.document) !== snapshot.text) fail("source-changed");
  } catch (error) { if (error instanceof AttachmentFailure) throw error; fail("unavailable"); }
}

export type SelectionSourceRevision = Pick<FileSnapshot, "identity" | "version" | "unsaved">;
export function sameSelectionSource(a: SelectionSourceRevision, b: SelectionSourceRevision): boolean {
  return a.identity === b.identity && a.version === b.version && a.unsaved === b.unsaved;
}
export function validateSelectionDocument(snapshot: FileSnapshot, workspace: Pick<typeof vscode.workspace, "textDocuments">, revision: SelectionSourceRevision): void {
  if (!workspace.textDocuments.includes(snapshot.document) || snapshot.document.isClosed) fail("unavailable");
  if (snapshot.document.version !== revision.version || snapshot.document.isDirty !== revision.unsaved) fail("source-changed");
}
export async function selectionSourceRevision(snapshot: FileSnapshot, workspace: Pick<typeof vscode.workspace, "textDocuments">, root: string, current: () => boolean): Promise<SelectionSourceRevision> {
  try {
    const actual = await source(root, snapshot.uri, current);
    if (actual.root !== snapshot.root || actual.target !== snapshot.target || !workspace.textDocuments.includes(snapshot.document) || snapshot.document.isClosed) fail("unavailable");
    return { identity: actual.identity, version: snapshot.document.version, unsaved: snapshot.document.isDirty };
  } catch (error) { if (error instanceof AttachmentFailure) throw error; return fail("unavailable"); }
}
export async function captureSelection(workspace: Pick<typeof vscode.workspace, "textDocuments">, root: string, editor: vscode.TextEditor | undefined, current: () => boolean): Promise<{ source: FileSnapshot; originalRange: SelectionRange }> {
  try {
    if (!editor) return fail("no-editor");
    if (editor.selections.length > 1) fail("multiple-selections");
    const selection = editor.selection; const document = editor.document;
    if (!editor.selections.length || selection.isEmpty) fail("empty-selection");
    if (document.isClosed || !workspace.textDocuments.includes(document)) fail("unavailable");
    const originalRange = { start: { line: selection.start.line, character: selection.start.character }, end: { line: selection.end.line, character: selection.end.character } };
    for (const position of [originalRange.start, originalRange.end]) {
      if (!Number.isSafeInteger(position.line) || !Number.isSafeInteger(position.character) || position.line < 0 || position.line >= document.lineCount || position.character < 0 || position.character > document.lineAt(position.line).range.end.character) fail("invalid-source");
    }
    const length = document.offsetAt(selection.end) - document.offsetAt(selection.start);
    if (length <= 0) fail("empty-selection");
    if (length > 262144) fail("text-too-large");
    const version = document.version; const unsaved = document.isDirty;
    const before = await source(root, document.uri, current);
    if (!current()) fail("preparation-cancelled");
    if (document.isClosed || !workspace.textDocuments.includes(document)) fail("unavailable");
    if (document.version !== version || document.isDirty !== unsaved) fail("source-changed");
    const text = checkedText(document.getText(selection));
    const after = await source(root, document.uri, current);
    if (!current()) fail("preparation-cancelled");
    if (before.root !== after.root || before.target !== after.target || before.identity !== after.identity || document.isClosed || !workspace.textDocuments.includes(document) || version !== document.version || unsaved !== document.isDirty || document.getText(selection) !== text) fail("source-changed");
    return { source: { ...after, document, uri: document.uri, version, unsaved, text, utf8Bytes: Buffer.byteLength(text, "utf8") }, originalRange };
  } catch (error) { if (error instanceof AttachmentFailure) throw error; return fail("unavailable"); }
}
