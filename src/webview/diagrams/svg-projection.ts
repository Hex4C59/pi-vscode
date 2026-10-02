export type SafeSvgNode = { tag: string; attrs: Record<string, string>; text?: string; children: SafeSvgNode[] };
const tags = new Set(["svg", "g", "defs", "symbol", "marker", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan", "title", "desc"]);
const numbers = new Set(["x", "y", "dx", "dy", "x1", "x2", "y1", "y2", "cx", "cy", "r", "rx", "ry", "width", "height", "markerWidth", "markerHeight", "refX", "refY", "stroke-width", "font-size"]);
const lists = new Set(["viewBox", "points", "stroke-dasharray"]);
const classes = new Set(["node", "label", "actor", "actor-line", "actor-top", "actor-bottom", "messageText", "messageLine0", "messageLine1", "flowchart-link", "arrowMarkerPath", "label-container", "background", "edge-pattern-dashed", "edge-pattern-dotted", "edgeLabel", "note", "noteText", "loopLine", "loopText"]);
const finiteNumbers = (value: string): boolean => /^[\d\s.,eE+-]+$/.test(value) && value.split(/[\s,]+/).filter(Boolean).every(word => Number.isFinite(Number(word)) && Math.abs(Number(word)) <= 8192);

function projectAttribute(name: string, value: string, ids: Map<string, string>): string | undefined {
  if (name.startsWith("on") || name === "href" || name === "xlink:href") throw new Error("Resource or handler");
  if (name === "id") return ids.get(value);
  if (name === "class") return value.split(/\s+/).filter(word => classes.has(word)).join(" ") || undefined;
  if (name === "marker-start" || name === "marker-end") {
    const id = value.match(/^url\(#([A-Za-z0-9_-]+)\)$/)?.[1];
    if (!id || !ids.has(id)) throw new Error("Nonlocal marker");
    return `url(#${ids.get(id)})`;
  }
  if (["width", "height"].includes(name) && /^\d+(?:\.\d+)?%$/.test(value)) return;
  if (["x", "y", "dx", "dy"].includes(name) && /^[-+]?\d+(?:\.\d+)?em$/.test(value) && Math.abs(parseFloat(value)) <= 64) return value;
  if (["width", "height", "stroke-width", "font-size"].includes(name) && /^\d+(?:\.\d+)?px$/.test(value) && parseFloat(value) <= (["stroke-width", "font-size"].includes(name) ? 64 : 8192)) return value;
  if (["stroke-width", "font-size"].includes(name) && /^\d+(?:\.\d+)?pt$/.test(value) && parseFloat(value) <= 48) return String(parseFloat(value) * 4 / 3);
  if (numbers.has(name) && finiteNumbers(value)) return value;
  if (lists.has(name) && finiteNumbers(value)) return value;
  if (name === "d" && value.length <= 16384 && /^[MmZzLlHhVvCcSsQqTtAa\d\s.,eE+-]+$/.test(value) && (value.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).every(word => Math.abs(Number(word)) <= 8192)) return value;
  if (name === "transform" && /^(?:(?:translate|scale|rotate|matrix)\([\d\s.,eE+-]+\)\s*)+$/.test(value) && (value.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).every(word => Math.abs(Number(word)) <= 8192)) return value;
  if (name === "text-anchor" && ["start", "middle", "end"].includes(value)) return value;
  if (name === "dominant-baseline" && ["central", "middle", "auto"].includes(value)) return value;
  if (name === "orient" && ["auto", "auto-start-reverse"].includes(value)) return value;
  if (name === "markerUnits" && ["strokeWidth", "userSpaceOnUse"].includes(value)) return value;
  if (name === "style" || name === "xmlns" || name === "xmlns:xlink" || name.startsWith("data-") || name.startsWith("aria-") || ["role", "fill", "stroke", "font-family", "font-weight", "font-style", "alignment-baseline", "name"].includes(name)) return;
  if (value.includes("url(") || name.includes(":")) throw new Error("Resource attribute");
  if (numbers.has(name) || lists.has(name) || ["d", "transform"].includes(name)) throw new Error("Geometry");
  return;
}
function projectElement(element: Element, ids: Map<string, string>, depth: number): SafeSvgNode {
  if (depth > 16 || !tags.has(element.localName) || element.namespaceURI !== "http://www.w3.org/2000/svg") throw new Error("Unsupported SVG");
  const attrs: Record<string, string> = {};
  for (const attribute of Array.from(element.attributes)) {
    const value = projectAttribute(attribute.name, attribute.value, ids);
    if (value !== undefined) attrs[attribute.name] = value;
  }
  const children = Array.from(element.children).filter(child => child.localName !== "style").map(child => projectElement(child, ids, depth + 1));
  const text = ["text", "tspan", "title", "desc"].includes(element.localName) ? Array.from(element.childNodes).filter(node => node.nodeType === 3).map(node => node.textContent ?? "").join("") : undefined;
  return { tag: element.localName, attrs, children, ...(text ? { text } : {}) };
}
/** Parse inert XML to a typed projection; never install upstream HTML or CSS. */
export function projectDiagramSvg(source: string, namespace: string): SafeSvgNode | undefined {
  if (new TextEncoder().encode(source).byteLength > 256 * 1024 || /<!DOCTYPE|<!ENTITY/i.test(source)) return;
  try {
    const doc = new window.DOMParser().parseFromString(source, "image/svg+xml");
    const elements = Array.from(doc.querySelectorAll("*"));
    if (doc.documentElement.localName !== "svg" || elements.length > 800 || doc.querySelector("parsererror")) return;
    const viewBox = doc.documentElement.getAttribute("viewBox") ?? "";
    const coordinates = viewBox.trim().split(/[\s,]+/).map(Number);
    if (!finiteNumbers(viewBox) || coordinates.length !== 4 || coordinates[2]! <= 0 || coordinates[3]! <= 0) return;
    const ids = new Map<string, string>();
    for (const element of elements) {
      const id = element.getAttribute("id");
      if (id !== null) { if (!/^[A-Za-z0-9_-]{1,160}$/.test(id) || ids.has(id)) return; ids.set(id, `${namespace}-${ids.size}`); }
    }
    return projectElement(doc.documentElement, ids, 0);
  } catch { return; }
}
