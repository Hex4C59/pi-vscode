import mermaid from "mermaid";
import { diagramSourceFailure, type DiagramFailure } from "./source-policy.js";
import { projectDiagramSvg, type SafeSvgNode } from "./svg-projection.js";
export type DiagramResult = { ok: true; svg: SafeSvgNode } | { ok: false; code: DiagramFailure };
export type DiagramApi = {
  initialize(config: typeof configuration): void;
  render(id: string, source: string, container?: HTMLElement): Promise<{ svg: string; bindFunctions?: (element: Element) => void }>;
};
const configuration = {
  startOnLoad: false, securityLevel: "strict" as const, htmlLabels: false, flowchart: { htmlLabels: false },
  maxTextSize: 4096, maxEdges: 40, suppressErrorRendering: true, logLevel: 5 as const, arrowMarkerAbsolute: false,
  fontFamily: "system-ui", themeVariables: { fontSize: "13px" }, secure: ["securityLevel", "startOnLoad", "maxTextSize", "maxEdges", "htmlLabels", "flowchart", "suppressErrorRendering", "fontFamily", "theme", "themeVariables"],
};
type Job = { source: string; signal: AbortSignal; resolve: (value: DiagramResult) => void; valid: boolean; cleanup(): void };
let sequence = 0;

/** One active plus one waiting render. Revocation never fabricates upstream settlement. */
export function createMermaidRenderer(api: DiagramApi) {
  let active: Job | undefined, waiting: Job | undefined;
  const revoke = (job: Job, code: DiagramFailure): void => {
    if (!job.valid) return;
    job.valid = false; job.cleanup(); job.resolve({ ok: false, code });
    if (waiting === job) waiting = undefined;
  };
  const run = async (job: Job): Promise<void> => {
    active = job; const id = `piDiagram${++sequence}`;
    const container = document.createElement("div"); container.className = "candidate__diagram-measure";
    document.body.append(container);
    try {
      api.initialize(configuration);
      const result = await api.render(id, job.source, container);
      if (job.valid) {
        const svg = typeof result?.svg === "string" ? projectDiagramSvg(result.svg, id) : undefined;
        job.resolve(svg ? { ok: true, svg } : { ok: false, code: "invalid" });
      }
    } catch { if (job.valid) job.resolve({ ok: false, code: "invalid" }); }
    finally {
      job.valid = false; job.cleanup(); container.remove(); active = undefined;
      const next = waiting; waiting = undefined;
      if (next?.valid) void run(next);
    }
  };
  const render = (source: string, signal: AbortSignal): Promise<DiagramResult> => {
    const failure = diagramSourceFailure(source);
    if (failure || signal.aborted) return Promise.resolve({ ok: false, code: failure ?? "cancelled" });
    if (active && waiting) return Promise.resolve({ ok: false, code: "busy" });
    return new Promise(resolve => {
      const job: Job = { source, signal, resolve, valid: true, cleanup: () => { clearTimeout(timer); signal.removeEventListener("abort", abort); } };
      const abort = () => revoke(job, "cancelled");
      const timer = setTimeout(() => revoke(job, "timeout"), 5000); signal.addEventListener("abort", abort, { once: true });
      if (active) waiting = job; else void run(job);
    });
  };
  return { render };
}
// Initialize synchronously before DOMContentLoaded: no default page auto-discovery.
mermaid.initialize(configuration);
export const mermaidRenderer = createMermaidRenderer(mermaid);
