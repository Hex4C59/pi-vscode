# Design It Twice

When the user wants to explore alternative interfaces for a chosen deepening candidate, develop contrasting designs sequentially in the current session. Based on "Design It Twice" (Ousterhout): your first idea is unlikely to be the best.

Uses the vocabulary in [SKILL.md](SKILL.md): **module**, **interface**, **seam**, **adapter**, **leverage**.

## Process

### 1. Frame the problem space

Before drafting alternatives, write a user-facing explanation of the problem space for the chosen candidate:

- The constraints any new interface would need to satisfy
- The dependencies it would rely on, and which category they fall into (see [DEEPENING.md](DEEPENING.md))
- A rough illustrative code sketch to ground the constraints, not a proposal, just a way to make the constraints concrete

Show this to the user, then proceed to Step 2.

### 2. Develop alternative interfaces

Develop at least two materially different interfaces against the same technical brief: file paths, coupling, dependency category from [DEEPENING.md](DEEPENING.md), and what sits behind the seam. Choose contrasting constraints that fit the question:

- Minimize the interface: aim for 1–3 entry points and high leverage per entry point.
- Maximize flexibility for multiple callers and extension.
- Optimize for the most common caller.
- Design around ports and adapters for cross-seam dependencies where applicable.

Use [SKILL.md](SKILL.md) and CONTEXT.md vocabulary consistently. For each design, record:

1. Interface (types, methods, params, plus invariants, ordering, error modes)
2. Usage example showing how callers use it
3. What the implementation hides behind the seam
4. Dependency strategy and adapters (see [DEEPENING.md](DEEPENING.md))
5. Trade-offs: where leverage is high, where it's thin

### 3. Present and compare

Present designs sequentially so the user can absorb each one, then compare them in prose. Contrast by **depth** (leverage at the interface), **locality** (where change concentrates), and **seam placement**.

After comparing, give your own recommendation: which design you think is strongest and why. If elements from different designs would combine well, propose a hybrid. Be opinionated: the user wants a strong read, not a menu.
