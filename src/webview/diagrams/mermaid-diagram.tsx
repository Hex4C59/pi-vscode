import { createElement, useEffect, useRef, useState, type ReactNode } from "react";
import { useUiText, type UiText } from "../components/index.js";
import { mermaidRenderer, type DiagramResult } from "./mermaid-renderer.js";
import { diagramSourceFailure } from "./source-policy.js";
import type { SafeSvgNode } from "./svg-projection.js";

function svgNode(node: SafeSvgNode, key: number, label?: string): ReactNode {
  const attrs = Object.fromEntries(Object.entries(node.attrs).map(([name, value]) => [name === "class" ? "className" : name.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase()), value]));
  const box = node.attrs.viewBox?.split(/[\s,]+/);
  return createElement(node.tag, { ...attrs, key, ...(node.tag === "svg" ? { role: "img", "aria-label": label, width: box?.[2], height: box?.[3] } : {}) }, node.text, ...node.children.map((child, index) => svgNode(child, index)));
}
function diagramNotice(result: DiagramResult | undefined, closed: boolean, failure: boolean): UiText | undefined {
  if (!closed) return "Incomplete Mermaid fence — source remains available.";
  if (failure) return "Diagram unsupported, unsafe or too large — source remains available.";
  if (result && !result.ok) return result.code === "cancelled" ? "Diagram cancelled — source remains available."
    : result.code === "timeout" ? "Diagram timed out — late results are discarded; computation may still be settling."
      : "Diagram unavailable — source remains available. You can retry.";
  return;
}
/** Rendering is opt-in; source and its Copy never depend on graph success. */
export function MermaidDiagram({ source, closed, children }: { source: string; closed: boolean; children: ReactNode }): ReactNode {
  const { text: t } = useUiText(); const operation = useRef<AbortController | undefined>(undefined);
  const [state, setState] = useState<{ source: string; busy: boolean; result?: DiagramResult }>();
  useEffect(() => { setState(undefined); return () => { operation.current?.abort(); operation.current = undefined; }; }, [source, closed]);
  const current = closed && state?.source === source ? state : undefined;
  const failure = !!diagramSourceFailure(source); const notice = diagramNotice(current?.result, closed, failure);
  const render = async (): Promise<void> => {
    if (operation.current || !closed || failure) return;
    const controller = new AbortController(); operation.current = controller;
    setState({ source, busy: true });
    try {
      const result = await mermaidRenderer.render(source, controller.signal);
      if (operation.current === controller) setState({ source, busy: false, result });
    } catch { if (operation.current === controller) setState({ source, busy: false, result: { ok: false, code: "invalid" } }); }
    finally { if (operation.current === controller) operation.current = undefined; }
  };
  const cancel = (): void => { operation.current?.abort(); operation.current = undefined; setState({ source, busy: false, result: { ok: false, code: "cancelled" } }); };
  return <div className="candidate__mermaid">
    <div className="candidate__diagram-actions">
      {closed && !failure && <button type="button" disabled={current?.busy} aria-label={t("Render Mermaid diagram")} onClick={() => { void render(); }}>{t("Render diagram")}</button>}
      {current?.busy && <button type="button" aria-label={t("Cancel diagram rendering")} onClick={cancel}>{t("Cancel")}</button>}
      <span role="status">{current?.busy ? t("Rendering diagram…") : notice ? t(notice) : ""}</span>
    </div>
    {current?.result?.ok && <div className="candidate__diagram" tabIndex={0} role="region" aria-label={t("Mermaid diagram — source follows below")}>{svgNode(current.result.svg, 0, t("Mermaid diagram — source follows below"))}</div>}
    {children}
  </div>;
}
