# Skill mechanics

Read this branch of [writing-for-agents](SKILL.md) when creating or editing a skill's metadata, invocation policy or routing. The main reference owns document structure and wording.

## Invocation

Choose invocation policy using the agent host's supported schema. Metadata is host-specific: a frontmatter switch recognized by one host is not automatically supported by another. Preserve the existing policy unless the user requests a change; prose alone cannot enforce how a host dispatches a skill.

- **Automatic discovery:** the description is a model-facing context pointer. State the distinct request branches that should reach the skill. Explicit user invocation can coexist with automatic discovery.
- **Explicit-only invocation:** when requested and supported, disable automatic discovery through the host's policy mechanism. Keep the required name and description, with a concise human-facing summary. Verify what the host actually loads before claiming a context-cost saving.

Invocation eligibility and file access are separate. An agent may read a linked reference without invoking it as a skill; do not infer that an explicit-only skill's files are inaccessible to other workflows. Put shared reference in one stable, linked location and state when it is needed.

## Splitting by invocation

Create a separate skill when a distinct user request or another supported workflow needs to reach it independently. Give it a precise trigger and bounded responsibility. Otherwise keep the branch as a linked reference in the existing skill; a new folder alone does not improve routing.

## Router skills

A router is useful when several specialized skills impose too much discovery work on the user. Name each destination and its trigger, then state whether the host permits direct invocation, reading a reference, or only directing the user to invoke it. Preserve the destination's authorization boundaries.

## Validation

Check required metadata, supported invocation policy, reference paths and trigger wording against the installed host's skill format. Verify that each route reaches the intended material and that host-specific examples are labeled. A syntax validator proves metadata shape, not correct discovery or behavior.
