# HTML Report Format

The architectural review is rendered as a single self-contained HTML file in the OS temp directory. Tailwind and Mermaid both come from CDNs. Mermaid handles graph-shaped diagrams reliably; hand-built divs and inline SVG handle the more editorial visuals (mass diagrams, cross-sections). Mix the two: don't lean on Mermaid for everything, it'll start to look generic.

Generated prose is everyday Chinese. The rule is [Tone](#tone).

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

Repo name, date, and a compact legend in everyday Chinese: 实线框 = 一块代码，虚线 = 调用方和内部的分界，红箭头 = 不该露出去的依赖，深色厚框 = 外面简单、里面承担复杂。No introduction paragraph. Straight into the candidates.

## Candidate card

The diagrams carry the weight. Prose is sparse everyday Chinese. Visible text follows [Tone](#tone), including words inside diagrams.

Each candidate is one `<article>`. Visible labels are Chinese:

- **标题**: short, names the change in everyday words (e.g. "收拢订单入口").
- **徽章**: recommendation strength (`强` = emerald, `值得探索` = amber, `推测` = slate), plus where the change sits (`就在这块代码里`, `可以换成本地实现`, `外部连接可以替换`, `测试用的假实现`). These four tags are the plain labels for `in-process`, `local-substitutable`, `ports & adapters`, and `mock`.
- **文件**: monospaced list, `font-mono text-sm`. Paths stay as paths.
- **之前 / 之后**: the centrepiece. Two columns, side by side. See patterns below. Column headings are `之前` and `之后`.
- **问题**: one everyday Chinese sentence. What hurts, in files and behaviour the reader already knows.
- **做法**: one everyday Chinese sentence. What changes.
- **收益**: short everyday Chinese phrases. e.g. "测试只从这一处进", "定价规则不再散落在调用方", "删掉 4 个空包装".
- **ADR 提示** (if applicable): one everyday Chinese line in an amber-tinted box.

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
- Diagram labels are short everyday Chinese, same rule as [Tone](#tone). Code identifiers stay in their original case. A label like `INTERFACE · MOUNTCHAT` is a failed label; write `对外只留：挂载聊天`.
- The only scripts are the Tailwind CDN and the Mermaid ESM import. The report is otherwise static: no app code, no interactivity beyond Mermaid's own rendering.

## Top recommendation section

One larger card. Heading `首要建议`. Candidate name, one Chinese sentence on why, anchor link to its card. That's it.

## Tone

The page is for a maintainer who has not read the design glossary. Write everyday Chinese. A sentence is done when that reader can say what is wrong and what would change without asking what a word means.

File paths, code identifiers, and domain terms taken from `CONTEXT.md` stay as written there. Everything else the reader sees — titles, badges, diagram labels, column headings, problems, solutions, wins, legends, ADR callouts — is everyday Chinese.

Say the design ideas in plain words:

| While exploring, the agent may think… | The page says… |
|---|---|
| shallow module | 调用方要懂的，和里面做的差不多多 |
| deep module | 外面只留很少的事，复杂留在里面 |
| interface | 调用方必须知道的事 |
| implementation | 里面的代码 |
| seam | 调用方和内部的分界 |
| leak | 不该由调用方知道的事露了出去 |
| adapter | 接上的一种具体做法 |
| leverage | 调用方少记几件事，还能用到同样的能力 |
| locality | 改动和 bug 集中在一处 |
| deletion test | 拿掉这块之后，复杂是消失了，还是散回调用方 |

**Phrasings that fit:**

- "订单入口这块代码，调用方要懂的和里面做的差不多多。"
- "定价规则露到了调用方，改一处修不好。"
- "收成一块：调用方只记一件事，测试也只从这里进。"
- "生产走 HTTP，测试走内存，所以这里值得单独切开。"

**收益** names that kind of gain: "bug 集中在一处", "调用方少记几件事", "空包装收进里面". Skip vague praise such as "更好维护" or "更干净". Skip the heading 「删除测试」; readers hear "delete the tests". Write what happens if that code is removed.

These English words stay in the agent's notes and off the page: module, interface, implementation, depth, deep, shallow, seam, adapter, leverage, locality. The same ban covers diagram labels and Mermaid node text.

No hedging, no throat-clearing. If a sentence could be a bullet, make it a bullet. If a bullet could be cut, cut it.
