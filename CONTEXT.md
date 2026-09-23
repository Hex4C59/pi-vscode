# pi VS Code domain glossary

English | [中文](CONTEXT.zh.md)

This glossary defines product vocabulary, not implementation or delivery status. Behavior and acceptance belong to the [PRD](docs/product-requirements.md).

## Language

**Extension loading policy**: The choice of which executable pi extensions may load: built-in only or explicitly trusted third-party extensions.
_Avoid_: tool approval, sandbox mode.

**Tool approval policy**: The rules for allowing, asking about or denying covered tool calls. It does not describe every action executable extension code can perform.
_Avoid_: extension trust, filesystem isolation.

**Project-resource consent**: The user's choice about loading protected project-local pi resources, distinct from workspace trust and tool authorization.
_Avoid_: blanket project permission.

**Live session**: The currently running agent conversation instance in its project; distinct from its saved history.
_Avoid_: saved transcript when describing temporary authorization lifetime.

**Saved session**: A conversation retained for later restoration, not a snapshot of project files or a running process.
_Avoid_: code checkpoint, live process takeover.

**Sequential session handoff**: Continuing a saved conversation in another entry point after leaving the original entry point.
_Avoid_: concurrent control, enforced exclusive ownership.

**Interaction cancellation**: Declining or dismissing a particular extension interaction, not stopping the whole task.
_Avoid_: Stop when only a dialog is cancelled.

**Stop**: A request to stop active task work and queued continuation, not to reverse completed effects.
_Avoid_: rollback, universal process termination.

**Attachment snapshot**: The text supplied as explicit message context at a particular time, distinct from later editor or disk contents.
_Avoid_: current file when describing historical attached text.

**Review snapshot**: Captured before/after content used to inspect an operation's already-applied changes.
_Avoid_: pending patch, current workspace diff, rollback checkpoint.

**Tool-reported target**: A file identified by a tool operation; this alone does not establish complete change attribution.
_Avoid_: all agent changes.

**Observed workspace change**: A file change observed during a task that may also include user, shell or concurrent activity.
_Avoid_: agent-only diff without attribution evidence.
