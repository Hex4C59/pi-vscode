import { SessionIcon } from "../sessions/session-icon.js";
import { useId, useLayoutEffect, useRef, useState, type FocusEvent as ReactFocusEvent, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactElement } from "react";
import type { ExecutionProfileProjection, ExtensionFeedback, ExtensionInteractionProjection, InteractionAnswer } from "../../../extension/contracts/index.js";
import { useUiText, type UiText, type UiTranslator } from "../../components/index.js";

type ActiveInteraction = NonNullable<ExtensionInteractionProjection["active"]>;

const interactionErrors = {
  "overflow-burst": "Repeated incoming requests exceeded the limit. New interactions are blocked; extension code may still be running.",
  "reply-failed": "An interaction reply could not be confirmed. The remote result is unknown; answers are blocked.",
  "timer-failed": "A local cutoff timer failed. Interaction handling is blocked.",
  "clock-failed": "The local clock is unavailable. Interaction handling is blocked.",
  "identifier-exhausted": "The interaction identifier budget is exhausted. Interaction handling is blocked.",
} satisfies Readonly<Record<string, UiText>>;
const feedbackKinds: Readonly<Record<ExtensionFeedback["kind"], UiText>> = {
  notify: "Notification", status: "Status", widget: "Widget text", title: "Requested title text", "editor-text": "Requested editor text",
};
const feedbackLevels: Readonly<Record<ExtensionFeedback["level"], UiText>> = { info: "Info", warning: "Warning", error: "Error" };
const profilePhases: Readonly<Record<ExecutionProfileProjection["phase"], UiText>> = {
  idle: "Runtime is idle.",
  selecting: "Waiting for host confirmation before loading a trusted extension.",
  switching: "Changing execution profile. Controls are temporarily disabled.",
  "recovery-required": "Runtime outcome is uncertain. Reloading or seeing no process does not clear recovery.",
  error: "Execution profile is not ready.",
};
const profileErrors = {
  "too-many-enabled": "Too many plugins are enabled. Disable extras in Settings so only one loads.",
  "inventory-unusable": "The plugin inventory cannot be read. Trusted apply did not start.",
  "no-enabled-plugin": "Enable a plugin in Settings before choosing Trusted execution.",
} satisfies Readonly<Record<string, UiText>>;

function interactionError(code: string, t: UiTranslator): string {
  return Object.hasOwn(interactionErrors, code) ? t(interactionErrors[code as keyof typeof interactionErrors]) : t("The host reported an interaction error. Remote completion is unknown.");
}

function profileError(code: string, t: UiTranslator): string {
  return Object.hasOwn(profileErrors, code) ? t(profileErrors[code as keyof typeof profileErrors]) : t("The host reported an execution-profile error. No profile change or recovery is implied.");
}

interface InteractionFormProps {
  active: ActiveInteraction;
  attempted: boolean;
  onAnswer(id: string, answer: InteractionAnswer): void;
  onCancel(id: string): void;
}

function formatLocalCutoff(timestamp: number, locale: string): string | null {
  const date = new Date(timestamp);
  if (!Number.isFinite(timestamp) || !Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === "zh-CN" ? "zh-CN" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function InteractionContext({ active }: Pick<InteractionFormProps, "active">): ReactElement {
  const { locale, text: t } = useUiText();
  const timestamp = active.localCutoffAt;
  const formatted = timestamp === undefined ? null : formatLocalCutoff(timestamp, locale);
  return (
    <div className="extension-interactions__context">
      <p className="extension-interactions__origin">{t("Origin: trusted runtime extension; not authenticated.")}</p>
      {timestamp !== undefined && <p data-role="local-cutoff" className="extension-interactions__cutoff">
        <span>{t("Local cutoff (receipt-based; not remote expiry):")}</span>{" "}
        {formatted === null ? t("time unavailable") : <time dateTime={new Date(timestamp).toISOString()}>{formatted}</time>}
      </p>}
    </div>
  );
}

function isActivelyEditing(element: Element | null): boolean {
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element?.getAttribute("contenteditable") === "true";
}


function interactionKeyDown(
  event: ReactKeyboardEvent<HTMLFormElement>,
  method: ActiveInteraction["method"],
  submit: () => void,
  cancel: () => void,
): void {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    cancel();
    return;
  }
  if (method === "editor") {
    if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();
      submit();
    }
    return;
  }
  if (event.key === "Enter" && !(event.target instanceof HTMLElement && event.target.closest("button") !== null)) {
    event.preventDefault();
    event.stopPropagation();
    submit();
  }
}

function SelectInteraction({ active, attempted, onAnswer, onCancel }: InteractionFormProps): ReactElement {
  const { text: t } = useUiText();
  const labelId = useId();
  const [optionId, setOptionId] = useState("");
  const submit = (): void => {
    if (active.method !== "select" || attempted || optionId === "") return;
    onAnswer(active.id, { method: "select", optionId });
  };
  const cancel = (): void => { if (!attempted) onCancel(active.id); };
  const onSubmit = (event: FormEvent<HTMLFormElement>): void => { event.preventDefault(); submit(); };
  if (active.method !== "select") return <></>;
  return (
    <form className="extension-interactions__form" onSubmit={onSubmit} onKeyDown={event => interactionKeyDown(event, active.method, submit, cancel)}>
      <h3 className="extension-interactions__title">{active.title}</h3>
      <InteractionContext active={active} />
      <label htmlFor={labelId}>{t("Select an option")}</label>
      <select id={labelId} aria-label={t("Select an option")} value={optionId} disabled={attempted}
        onChange={event => setOptionId(event.currentTarget.value)}>
        <option value="">{t("Choose an option…")}</option>
        {active.options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
      <div className="extension-interactions__actions">
        <button type="submit" data-action="answer" disabled={attempted || optionId === ""}>{t("Submit response")}</button>
        <button type="button" data-action="cancel" disabled={attempted} onClick={cancel}>{t("Cancel this interaction")}</button>
      </div>
      <p className="extension-interactions__warning">{t("Canceling this request may let the extension continue running. It does not stop the task.")}</p>
    </form>
  );
}

function ConfirmInteraction({ active, attempted, onAnswer, onCancel }: InteractionFormProps): ReactElement {
  const { text: t } = useUiText();
  const groupName = useId();
  const [value, setValue] = useState<boolean | null>(null);
  const submit = (): void => {
    if (active.method !== "confirm" || attempted || value === null) return;
    onAnswer(active.id, { method: "confirm", value });
  };
  const cancel = (): void => { if (!attempted) onCancel(active.id); };
  const onSubmit = (event: FormEvent<HTMLFormElement>): void => { event.preventDefault(); submit(); };
  if (active.method !== "confirm") return <></>;
  return (
    <form className="extension-interactions__form" onSubmit={onSubmit} onKeyDown={event => interactionKeyDown(event, active.method, submit, cancel)}>
      <h3 className="extension-interactions__title">{active.title}</h3>
      <InteractionContext active={active} />
      <p className="extension-interactions__literal">{active.message}</p>
      <fieldset disabled={attempted}>
        <legend>{t("Choose a response")}</legend>
        <label><input type="radio" name={groupName} value="true" checked={value === true} onChange={() => setValue(true)} />{t("Yes")}</label>
        <label><input type="radio" name={groupName} value="false" checked={value === false} onChange={() => setValue(false)} />{t("No")}</label>
      </fieldset>
      <div className="extension-interactions__actions">
        <button type="submit" data-action="answer" disabled={attempted || value === null}>{t("Submit response")}</button>
        <button type="button" data-action="cancel" disabled={attempted} onClick={cancel}>{t("Cancel this interaction")}</button>
      </div>
      <p className="extension-interactions__warning">{t("Canceling this request may let the extension continue running. It does not stop the task.")}</p>
    </form>
  );
}

function InputInteraction({ active, attempted, onAnswer, onCancel }: InteractionFormProps): ReactElement {
  const { text: t } = useUiText();
  const labelId = useId();
  const [text, setText] = useState("");
  const [sizeError, setSizeError] = useState(false);
  const errorId = useId();
  const submit = (): void => {
    if (active.method !== "input" || attempted) return;
    if (new TextEncoder().encode(text).byteLength > 32_768) { setSizeError(true); return; }
    setSizeError(false);
    onAnswer(active.id, { method: "input", text });
  };
  const cancel = (): void => { if (!attempted) onCancel(active.id); };
  const onSubmit = (event: FormEvent<HTMLFormElement>): void => { event.preventDefault(); submit(); };
  if (active.method !== "input") return <></>;
  return (
    <form className="extension-interactions__form" onSubmit={onSubmit} onKeyDown={event => interactionKeyDown(event, active.method, submit, cancel)}>
      <h3 className="extension-interactions__title">{active.title}</h3>
      <InteractionContext active={active} />
      <label htmlFor={labelId}>{t("Your response")}</label>
      <input id={labelId} type="text" aria-label={t("Your response")} value={text} placeholder={active.placeholder ?? t("Type your response…")}
        disabled={attempted} aria-invalid={sizeError || undefined} aria-describedby={sizeError ? errorId : undefined}
        onChange={event => { setText(event.currentTarget.value); setSizeError(false); }} />
      {sizeError && <p id={errorId} role="alert" className="extension-interactions__warning">{t("Response exceeds 32,768 UTF-8 bytes (32 KiB). Shorten the text and submit again, or cancel this interaction.")}</p>}
      <div className="extension-interactions__actions">
        <button type="submit" data-action="answer" disabled={attempted}>{t("Submit response")}</button>
        <button type="button" data-action="cancel" disabled={attempted} onClick={cancel}>{t("Cancel this interaction")}</button>
      </div>
      <p className="extension-interactions__warning">{t("Canceling this request may let the extension continue running. It does not stop the task.")}</p>
    </form>
  );
}
function EditorInteraction({ active, attempted, onAnswer, onCancel }: InteractionFormProps): ReactElement {
  const { text: t } = useUiText();
  const labelId = useId();
  const [text, setText] = useState(active.method === "editor" ? active.prefill ?? "" : "");
  const [sizeError, setSizeError] = useState(false);
  const errorId = useId();
  const submit = (): void => {
    if (active.method !== "editor" || attempted) return;
    if (new TextEncoder().encode(text).byteLength > 32_768) { setSizeError(true); return; }
    setSizeError(false);
    onAnswer(active.id, { method: "editor", text });
  };
  const cancel = (): void => { if (!attempted) onCancel(active.id); };
  const onSubmit = (event: FormEvent<HTMLFormElement>): void => { event.preventDefault(); submit(); };
  if (active.method !== "editor") return <></>;
  return (
    <form className="extension-interactions__form" onSubmit={onSubmit} onKeyDown={event => interactionKeyDown(event, active.method, submit, cancel)}>
      <h3 className="extension-interactions__title">{active.title}</h3>
      <InteractionContext active={active} />
      <label htmlFor={labelId}>{t("Editor text")}</label>
      <textarea id={labelId} aria-label={t("Editor text")} rows={6} value={text} disabled={attempted}
        aria-invalid={sizeError || undefined} aria-describedby={sizeError ? errorId : undefined}
        onChange={event => { setText(event.currentTarget.value); setSizeError(false); }} />
      {sizeError && <p id={errorId} role="alert" className="extension-interactions__warning">{t("Response exceeds 32,768 UTF-8 bytes (32 KiB). Shorten the text and submit again, or cancel this interaction.")}</p>}
      <div className="extension-interactions__actions">
        <button type="submit" data-action="answer" disabled={attempted}>{t("Submit response")}</button>
        <button type="button" data-action="cancel" disabled={attempted} onClick={cancel}>{t("Cancel this interaction")}</button>
      </div>
      <p className="extension-interactions__hint">{t("Press Ctrl+Enter to submit; Enter adds a new line.")}</p>
      <p className="extension-interactions__warning">{t("Canceling this request may let the extension continue running. It does not stop the task.")}</p>
    </form>
  );
}
export interface ExtensionInteractionsProps {
  state: ExtensionInteractionProjection;
  onAnswer(id: string, answer: InteractionAnswer): void;
  onCancel(id: string): void;
}

export function ExtensionInteractions({ state, onAnswer, onCancel }: ExtensionInteractionsProps): ReactElement {
  const { text: t } = useUiText();
  const headingId = useId();
  const panelRef = useRef<HTMLDetailsElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const formHadFocusRef = useRef(false);
  const attemptedRef = useRef<string | null>(null);
  const [attemptedId, setAttemptedId] = useState<string | null>(null);
  const interactionBlocked = state.phase === "blocked" || state.errorCode !== null;
  const attempt = (id: string, send: () => void): void => {
    if (interactionBlocked || attemptedRef.current === id) return;
    attemptedRef.current = id;
    setAttemptedId(id);
    send();
  };
  const active = state.active;
  const activeId = active?.id ?? null;
  const focusFirstField = (): void => {
    const panel = panelRef.current;
    const fields = panel?.querySelectorAll<HTMLElement>(".extension-interactions__form select, .extension-interactions__form input, .extension-interactions__form textarea");
    const first = fields ? [...fields].find(field => !field.matches(":disabled")) : undefined;
    first?.focus();
    first?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  };
  useLayoutEffect(() => {
    const previousId = activeIdRef.current;
    if (previousId === activeId) return;
    const doc = panelRef.current?.ownerDocument;
    if (previousId === null && activeId !== null && doc) {
      const prior = doc.activeElement;
      previousFocusRef.current = prior instanceof HTMLElement && prior !== doc.body && prior.isConnected ? prior : null;
      formHadFocusRef.current = false;
      if (!isActivelyEditing(prior)) focusFirstField();
    } else if (previousId !== null && activeId !== null) {
      const focused = doc?.activeElement;
      const focusWasRemoved = !focused || focused === doc?.body || !(focused instanceof HTMLElement) || !focused.isConnected;
      if (formHadFocusRef.current && focusWasRemoved) focusFirstField();
    } else if (previousId !== null && activeId === null && doc) {
      const focused = doc.activeElement;
      const focusWasRemoved = focused === doc.body || !(focused instanceof HTMLElement) || !focused.isConnected;
      const prior = previousFocusRef.current;
      if (formHadFocusRef.current && focusWasRemoved && prior?.isConnected) prior.focus({ preventScroll: true });
      previousFocusRef.current = null;
      formHadFocusRef.current = false;
    }
    activeIdRef.current = activeId;
  }, [activeId]);
  const onFocusCapture = (event: ReactFocusEvent<HTMLElement>): void => {
    const target = event.target;
    if (active && target instanceof Node && event.currentTarget.querySelector(".extension-interactions__form")?.contains(target)) {
      formHadFocusRef.current = true;
      if (target instanceof HTMLElement) target.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    }
  };
  const onBlurCapture = (event: ReactFocusEvent<HTMLElement>): void => {
    const target = event.relatedTarget;
    if (target instanceof Node && !event.currentTarget.contains(target)) formHadFocusRef.current = false;
  };
  const formProps: InteractionFormProps | null = active ? {
    active,
    attempted: interactionBlocked || attemptedId === active.id,
    onAnswer: (id, answer) => attempt(id, () => onAnswer(id, answer)),
    onCancel: id => attempt(id, () => onCancel(id)),
  } : null;
  let form: ReactElement | null = null;
  if (formProps?.active.method === "select") form = <SelectInteraction key={formProps.active.id} {...formProps} />;
  else if (formProps?.active.method === "confirm") form = <ConfirmInteraction key={formProps.active.id} {...formProps} />;
  else if (formProps?.active.method === "input") form = <InputInteraction key={formProps.active.id} {...formProps} />;
  else if (formProps?.active.method === "editor") form = <EditorInteraction key={formProps.active.id} {...formProps} />;
  return (
    <details open={active !== null || interactionBlocked || undefined} ref={panelRef} className="extension-interactions" aria-labelledby={headingId} onFocusCapture={onFocusCapture} onBlurCapture={onBlurCapture}>
      <summary><h2 id={headingId}>{active !== null || interactionBlocked ? t("Extension interactions") : t("Extension feedback")}</h2></summary>
      {interactionBlocked && <div role="alert" className="extension-interactions__error">
        <p>{t("Extension interaction handling is blocked. New answers are disabled; runtime work may still be running.")}</p>
        {state.errorCode !== null && <p>{interactionError(state.errorCode, t)}</p>}
      </div>}
      {form ?? <p role="status">{t("No extension interaction is active.")}</p>}
      {state.queuedCount > 0 && <p role="status" className="extension-interactions__queue">{t(state.queuedCount === 1 ? "{count} interaction queued." : "{count} interactions queued.", { count: state.queuedCount })}</p>}
      <p className="extension-interactions__limitations">{t("Custom/component TUI and arbitrary terminal layouts are not rendered. Only standard forms and bounded literal feedback are shown.")}</p>
      {(state.feedback.length > 0 || state.omittedFeedback > 0) && <section className="extension-interactions__feedback" aria-label={t("Extension feedback")}>
        <h3>{t("Extension feedback")}</h3>
        {state.omittedFeedback > 0 && <p className="extension-interactions__omitted" role="status">{t(state.omittedFeedback === 1 ? "{count} older feedback item was omitted due to capacity." : "{count} older feedback items were omitted due to capacity.", { count: state.omittedFeedback })}</p>}
        {state.feedback.length > 0 && <ul className="extension-interactions__feedback-list">
          {state.feedback.map(entry => <li key={entry.id} className={`extension-interactions__feedback-entry is-${entry.level}`}>
            <p className="extension-interactions__feedback-label">{t(feedbackKinds[entry.kind])} · {t(feedbackLevels[entry.level])}</p>
            <pre className="extension-interactions__feedback-text">{entry.text}</pre>
          </li>)}
        </ul>}
      </section>}
    </details>
  );
}

export interface ExecutionProfileControlsProps {
  state: ExecutionProfileProjection;
  onChoose(profile: "controlled" | "trusted"): void;
  onEnd(): void;
  onRecover(): void;
  /** `settings` is the compact settings dialog; `full` keeps legacy dense disclosure for direct mounts. */
  density?: "settings" | "full";
}

export function ExecutionProfileControls({ state, onChoose, onEnd, onRecover, density = "full" }: ExecutionProfileControlsProps): ReactElement {
  const { text: t } = useUiText();
  const headingId = useId();
  const notesId = useId();
  const isPending = state.phase === "selecting" || state.phase === "switching";
  const profileLabel = state.profile === "trusted" ? t("Trusted execution") : t("Controlled execution");
  const badge = state.displayName === null ? profileLabel : `${profileLabel} · ${state.displayName}`;
  const disabledSwitch = !state.canSwitch || (state.phase !== "idle" && state.phase !== "error");
  const disabledLifecycleAction = isPending;
  const showLifecycle = state.canEnd || state.canRecover || state.phase === "recovery-required";
  const compact = density === "settings";
  const notes = (
    <>
      <p className="execution-profile-controls__coverage">{t("Trusted extension code is not a security sandbox. Its internal code and external effects are outside covered approval; covered tools still ask for approval.")}</p>
      <p className="execution-profile-controls__domain">{t("Each VS Code window admits its own runtime. Two windows on the same folder can change the same files at once.")}</p>
      <p className="execution-profile-controls__chooser-note">{t("Choosing trusted loads the enabled Settings plugin after host confirmation. Add plugins in Settings.")}</p>
    </>
  );
  const choices = (
    <div className={compact ? "execution-profile-controls__choices" : "execution-profile-controls__actions"} role="group" aria-label={t("Execution profile")}>
      {compact ? <>
        <button type="button" className="execution-profile-controls__choice" data-profile-choice="controlled" aria-pressed={state.profile === "controlled"} disabled={disabledSwitch} onClick={() => onChoose("controlled")}>
          <span className="execution-profile-controls__choice-title">{t("Controlled execution")}</span>
          {state.profile === "controlled" && <span className="execution-profile-controls__choice-mark" aria-hidden="true"><SessionIcon name="check" /></span>}
          <span className="execution-profile-controls__choice-note">{t("Covered tools ask for approval. This is not a sandbox.")}</span>
        </button>
        <button type="button" className="execution-profile-controls__choice" data-profile-choice="trusted" aria-pressed={state.profile === "trusted"} disabled={disabledSwitch} onClick={() => onChoose("trusted")} title={t("Choosing trusted loads the enabled Settings plugin after host confirmation. Add plugins in Settings.")}>
          <span className="execution-profile-controls__choice-title">{t("Trusted execution")}</span>
          {state.profile === "trusted" && <span className="execution-profile-controls__choice-mark" aria-hidden="true"><SessionIcon name="check" /></span>}
          <span className="execution-profile-controls__choice-note">{t("Loads the enabled Settings plugin after host confirmation. Not a sandbox.")}</span>
        </button>
      </> : <>
        <button type="button" data-profile-choice="controlled" disabled={disabledSwitch} onClick={() => onChoose("controlled")}>
          {t("Use controlled execution")}
        </button>
        <button type="button" data-profile-choice="trusted" disabled={disabledSwitch} onClick={() => onChoose("trusted")} title={t("Choosing trusted loads the enabled Settings plugin after host confirmation. Add plugins in Settings.")}>
          {t("Use trusted execution")}
        </button>
      </>}
    </div>
  );
  return (
    <section className={`execution-profile-controls${compact ? " is-settings" : ""}`} aria-labelledby={headingId}>
      <h2 id={headingId}>{t("Execution profile")}</h2>
      <p className={`execution-profile-controls__badge is-${state.profile}`} data-profile-badge={state.profile}>{badge}</p>
      {(!compact || state.phase !== "idle") && <p className="execution-profile-controls__phase" role={state.phase === "error" || state.phase === "recovery-required" ? "alert" : "status"}>
        {t(profilePhases[state.phase])}
      </p>}
      {state.errorCode !== null && <p className="execution-profile-controls__error" role="alert">{profileError(state.errorCode, t)}</p>}
      {choices}
      {(!compact || showLifecycle) && <div className="execution-profile-controls__actions">
        <button type="button" data-action="end-owned-runtime" disabled={!state.canEnd || disabledLifecycleAction} onClick={onEnd}>
          {t("End owned runtime…")}
        </button>
        <button type="button" data-action="recover-controlled-runtime" disabled={!state.canRecover || disabledLifecycleAction} onClick={onRecover}>
          {t("Recover controlled execution")}
        </button>
      </div>}
      {compact
        ? <details className="execution-profile-controls__notes">
            <summary id={notesId}>{t("Notes")}</summary>
            {notes}
            {showLifecycle && <p className="execution-profile-controls__end-warning">{t("Ending an owned runtime may interrupt irreversible work. The host will ask for confirmation.")}</p>}
          </details>
        : <>
            {notes}
            <p className="execution-profile-controls__end-warning">{t("Ending an owned runtime may interrupt irreversible work. The host will ask for confirmation.")}</p>
          </>}
    </section>
  );
}

/** Forced-visible strip when recovery cannot stay buried in settings alone. */
export function RuntimeRecoveryBanner({ state, onEnd, onRecover }: Omit<ExecutionProfileControlsProps, "onChoose" | "density">): ReactElement | null {
  const { text: t } = useUiText();
  if (state.phase !== "recovery-required" && state.phase !== "error") return null;
  if (!state.canEnd && !state.canRecover && state.phase !== "recovery-required") return null;
  return (
    <div className="candidate__runtime-recovery" role="alert">
      <p>{t(profilePhases[state.phase])}</p>
      <div className="candidate__runtime-recovery-actions">
        <button type="button" data-action="recover-controlled-runtime" disabled={!state.canRecover} onClick={onRecover}>{t("Recover controlled execution")}</button>
        <button type="button" data-action="end-owned-runtime" disabled={!state.canEnd} onClick={onEnd}>{t("End owned runtime…")}</button>
      </div>
    </div>
  );
}
