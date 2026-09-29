# HTML Report Format

The architectural review is rendered as a single self-contained HTML file in the OS temp directory. Tailwind and Mermaid both come from CDNs. Mermaid handles graph-shaped diagrams reliably; hand-built divs and inline SVG handle the more editorial visuals (mass diagrams, cross-sections). Mix the two: don't lean on Mermaid for everything, it'll start to look generic.

Generated prose is Chinese. Architecture nouns stay English. The rule is [Tone](#tone).

## Scaffold

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="utf-8" />
    <title>{{repo name}} 的架构复查</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      /* small custom layer for things Tailwind doesn't cover cleanly:
         dashed seam lines, hand-drawn-feeling arrow heads, etc. */
      .seam { stroke-dasharray: 4 4; }
      .leak { stroke: #dc2626; }
      .deep { background: linear-gradient(135deg, #0f172a, #1e293b); }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="candidates" class="space-y-10">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

## Header

Repo name, date, and a compact legend in Chinese: 实线框 = module，虚线 = seam，红箭头 = 泄漏，深色厚框 = deep module. No introduction paragraph. Straight into the candidates.

## Candidate card

The diagrams carry the weight. Prose is sparse Chinese. Architecture nouns from `/codebase-design` stay English inside those sentences.

Each candidate is one `<article>`. Visible labels are Chinese:

- **标题**: short, names the deepening (e.g. "收拢 Order intake").
- **徽章**: recommendation strength (`强` = emerald, `值得探索` = amber, `推测` = slate), plus a dependency-category tag (`进程内`, `可本地替换`, `端口与 adapter`, `测试替身`). These four tags are the Chinese labels for `in-process`, `local-substitutable`, `ports & adapters`, and `mock`.
- **文件**: monospaced list, `font-mono text-sm`.
- **之前 / 之后**: the centrepiece. Two columns, side by side. See patterns below. Column headings are `之前` and `之后`.
- **问题**: one Chinese sentence. What hurts.
- **做法**: one Chinese sentence. What changes.
- **收益**: short Chinese phrases. e.g. "测试只过一个 interface", "定价泄漏停在 seam 内", "删掉 4 个 shallow 包装".
- **ADR 提示** (if applicable): one Chinese line in an amber-tinted box.

No paragraphs of explanation. If the diagram needs a paragraph to be understood, redraw the diagram.

## Diagram patterns

Pick the pattern that fits the candidate. Mix them. Don't make every diagram look the same. Variety is part of the point.

### Mermaid graph (the workhorse for dependencies / call flow)

Use a Mermaid `flowchart` or `graph` when the point is "X calls Y calls Z, and look at the mess." Wrap it in a Tailwind-styled card so it doesn't feel parachuted in. Style with classDef to colour leakage edges red and the deep module dark. Sequence diagrams work well for "before: 6 round-trips; after: 1."

```html
<div class="rounded-lg border border-slate-200 bg-white p-4">
  <pre class="mermaid">
    flowchart LR
      A[OrderHandler] --> B[OrderValidator]
      B --> C[OrderRepo]
      C -.leak.-> D[PricingClient]
      classDef leak stroke:#dc2626,stroke-width:2px;
      class C,D leak
  </pre>
</div>
```

### Hand-built boxes-and-arrows (when Mermaid's layout fights you)

Modules as `<div>`s with borders and labels. Arrows as inline SVG `<line>` or `<path>` elements positioned absolutely over a relative container. Reach for this when you want the "after" diagram to feel like one thick-bordered deep module with greyed-out internals, since Mermaid won't render that with the right weight.

### Cross-section (good for layered shallowness)

Stack horizontal bands (`h-12 border-l-4`) to show layers a call passes through. Before: 6 thin layers each doing nothing. After: 1 thick band labelled with the consolidated responsibility.

### Mass diagram (good for "interface as wide as implementation")

Two rectangles per module: one for interface surface area, one for implementation. Before: interface rectangle is nearly as tall as the implementation rectangle (shallow). After: interface rectangle is short, implementation rectangle is tall (deep).

### Call-graph collapse

Before: a tree of function calls rendered as nested boxes. After: the same tree collapsed into one box, with the now-internal calls shown faded inside it.

## Style guidance

- Lean editorial, not corporate-dashboard. Generous whitespace. Serif optional for headings (`font-serif` works well with stone/slate).
- Colour sparingly: one accent (emerald or indigo) plus red for leakage and amber for warnings.
- Keep diagrams ~320px tall so before/after sits comfortably side by side without scrolling.
- Use `text-xs uppercase tracking-wider` for module labels inside diagrams, so they read as schematic, not as UI.
- The only scripts are the Tailwind CDN and the Mermaid ESM import. The report is otherwise static: no app code, no interactivity beyond Mermaid's own rendering.

## Top recommendation section

One larger card. Heading `首要建议`. Candidate name, one Chinese sentence on why, anchor link to its card. That's it.

## Tone

Write the report in Chinese. Keep these architecture nouns in English, embedded in the Chinese sentence: module, interface, implementation, depth, deep, shallow, seam, adapter, leverage, locality.

Use those English nouns for the architecture. File paths, code identifiers, and domain terms taken from `CONTEXT.md` stay as written there. Everything else the reader sees — titles, badges, column headings, problems, solutions, wins, legends, ADR callouts — is Chinese.

**Phrasings that fit:**

- "Order intake module 是 shallow 的：interface 几乎和 implementation 一样宽。"
- "定价从 seam 漏了出去。"
- "加深：一个 interface，一处测试。"
- "两个 adapter 才撑得起这条 seam：生产用 HTTP，测试用内存。"

**收益** name the gain with those nouns: *"locality：bug 集中在一个 module"*, *"leverage：一个 interface，N 个调用点"*, *"interface 变短，implementation 吃进那些包装"*. Glossary gains only; skip vague praise such as "更好维护" or "更干净".

No hedging, no throat-clearing. If a sentence could be a bullet, make it a bullet. If a bullet could be cut, cut it. If a term isn't in the `/codebase-design` glossary, reach for one that is before inventing a new one.
