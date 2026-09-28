import { useId, useLayoutEffect, useRef, useState, type FocusEvent as ReactFocusEvent, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactElement } from "react";
import type { ExecutionProfileProjection, ExtensionFeedback, ExtensionInteractionProjection, InteractionAnswer } from "../../extension/contracts/index.js";

type Language = "en" | "zh-CN";
type ActiveInteraction = NonNullable<ExtensionInteractionProjection["active"]>;

interface InteractionCopy {
  heading: string;
  empty: string;
  selectLabel: string;
  chooseOption: string;
  inputLabel: string;
  editorLabel: string;
  inputPlaceholder: string;
  answerTooLarge: string;
  confirmLegend: string;
  yes: string;
  no: string;
  submit: string;
  cancel: string;
  cancellationWarning: string;
  origin: string;
  localCutoff: string;
  unavailableTime: string;
  limitations: string;
  blocked: string;
  unknownError: string;
  feedbackHeading: string;
  omittedFeedback(count: number): string;
  queued(count: number): string;
  errors: Readonly<Record<string, string>>;
  feedbackKinds: Readonly<Record<ExtensionFeedback["kind"], string>>;
  feedbackLevels: Readonly<Record<ExtensionFeedback["level"], string>>;
}

const interactionCopy: Record<Language, InteractionCopy> = {
  en: {
    heading: "Extension interactions",
    empty: "No extension interaction is active.",
    selectLabel: "Select an option",
    chooseOption: "Choose an option…",
    inputLabel: "Your response",
    editorLabel: "Editor text",
    inputPlaceholder: "Type your response…",
    answerTooLarge: "Response exceeds 32,768 UTF-8 bytes (32 KiB). Shorten the text and submit again, or cancel this interaction.",
    confirmLegend: "Choose a response",
    yes: "Yes",
    no: "No",
    submit: "Submit response",
    cancel: "Cancel this interaction",
    cancellationWarning: "Canceling this request may let the extension continue running. It does not stop the task.",
    origin: "Origin: trusted runtime extension; not authenticated.",
    localCutoff: "Local cutoff (receipt-based; not remote expiry):",
    unavailableTime: "time unavailable",
    limitations: "Custom/component TUI and arbitrary terminal layouts are not rendered. Only standard forms and bounded literal feedback are shown.",
    blocked: "Extension interaction handling is blocked. New answers are disabled; runtime work may still be running.",
    unknownError: "The host reported an interaction error. Remote completion is unknown.",
    feedbackHeading: "Extension feedback",
    omittedFeedback: count => `${count} older feedback item${count === 1 ? " was" : "s were"} omitted due to capacity.`,
    queued: count => `${count} interaction${count === 1 ? "" : "s"} queued.`,
    errors: {
      "overflow-burst": "Repeated incoming requests exceeded the limit. New interactions are blocked; extension code may still be running.",
      "reply-failed": "An interaction reply could not be confirmed. The remote result is unknown; answers are blocked.",
      "timer-failed": "A local cutoff timer failed. Interaction handling is blocked.",
      "clock-failed": "The local clock is unavailable. Interaction handling is blocked.",
      "identifier-exhausted": "The interaction identifier budget is exhausted. Interaction handling is blocked.",
    },
    feedbackKinds: { notify: "Notification", status: "Status", widget: "Widget text", title: "Requested title text", "editor-text": "Requested editor text" },
    feedbackLevels: { info: "Info", warning: "Warning", error: "Error" },
  },
  "zh-CN": {
    heading: "扩展交互",
    empty: "当前没有待处理的扩展交互。",
    selectLabel: "选择一个选项",
    chooseOption: "请选择…",
    inputLabel: "你的答复",
    editorLabel: "编辑文本",
    inputPlaceholder: "输入答复…",
    answerTooLarge: "答复超过 32,768 UTF-8 字节（32 KiB）。请缩短文本后重新提交，或取消此交互。",
    confirmLegend: "选择答复",
    yes: "是",
    no: "否",
    submit: "提交答复",
    cancel: "取消此交互",
    cancellationWarning: "取消此请求后，扩展仍可能继续运行；这不会停止任务。",
    origin: "来源：受信运行时扩展；未经认证。",
    localCutoff: "本地截止时间（基于回执；不代表远端过期）：",
    unavailableTime: "时间不可用",
    limitations: "不渲染自定义／组件 TUI 或任意终端布局。此处仅显示标准表单与有界字面反馈。",
    blocked: "扩展交互处理已阻止。答复已禁用；运行时工作仍可能继续。",
    unknownError: "宿主报告了交互错误。远端是否完成未知。",
    feedbackHeading: "扩展反馈",
    omittedFeedback: count => `因容量限制，已有 ${count} 条较早反馈未显示。`,
    queued: count => `有 ${count} 个交互正在排队。`,
    errors: {
      "overflow-burst": "连续收到的请求超过上限。新交互已阻止；扩展代码仍可能运行。",
      "reply-failed": "无法确认交互答复是否送达。远端结果未知；答复已阻止。",
      "timer-failed": "本地截止计时器失败，交互处理已阻止。",
      "clock-failed": "本地时钟不可用，交互处理已阻止。",
      "identifier-exhausted": "交互标识预算已耗尽，交互处理已阻止。",
    },
    feedbackKinds: { notify: "通知", status: "状态", widget: "组件文本", title: "请求显示的标题文本", "editor-text": "请求显示的编辑器文本" },
    feedbackLevels: { info: "信息", warning: "警告", error: "错误" },
  },
};
interface InteractionFormProps {
  active: ActiveInteraction;
  language: Language;
  attempted: boolean;
  onAnswer(id: string, answer: InteractionAnswer): void;
  onCancel(id: string): void;
}

function formatLocalCutoff(timestamp: number, language: Language): string | null {
  const date = new Date(timestamp);
  if (!Number.isFinite(timestamp) || !Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function InteractionContext({ active, language }: Pick<InteractionFormProps, "active" | "language">): ReactElement {
  const copy = interactionCopy[language];
  const timestamp = active.localCutoffAt;
  const formatted = timestamp === undefined ? null : formatLocalCutoff(timestamp, language);
  return (
    <div className="extension-interactions__context">
      <p className="extension-interactions__origin">{copy.origin}</p>
      {timestamp !== undefined && <p data-role="local-cutoff" className="extension-interactions__cutoff">
        <span>{copy.localCutoff}</span>{" "}
        {formatted === null ? copy.unavailableTime : <time dateTime={new Date(timestamp).toISOString()}>{formatted}</time>}
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

function SelectInteraction({ active, language, attempted, onAnswer, onCancel }: InteractionFormProps): ReactElement {
  const copy = interactionCopy[language];
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
      <InteractionContext active={active} language={language} />
      <label htmlFor={labelId}>{copy.selectLabel}</label>
      <select id={labelId} aria-label={copy.selectLabel} value={optionId} disabled={attempted}
        onChange={event => setOptionId(event.currentTarget.value)}>
        <option value="">{copy.chooseOption}</option>
        {active.options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
      <div className="extension-interactions__actions">
        <button type="submit" data-action="answer" disabled={attempted || optionId === ""}>{copy.submit}</button>
        <button type="button" data-action="cancel" disabled={attempted} onClick={cancel}>{copy.cancel}</button>
      </div>
      <p className="extension-interactions__warning">{copy.cancellationWarning}</p>
    </form>
  );
}

function ConfirmInteraction({ active, language, attempted, onAnswer, onCancel }: InteractionFormProps): ReactElement {
  const copy = interactionCopy[language];
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
      <InteractionContext active={active} language={language} />
      <p className="extension-interactions__literal">{active.message}</p>
      <fieldset disabled={attempted}>
        <legend>{copy.confirmLegend}</legend>
        <label><input type="radio" name={groupName} value="true" checked={value === true} onChange={() => setValue(true)} />{copy.yes}</label>
        <label><input type="radio" name={groupName} value="false" checked={value === false} onChange={() => setValue(false)} />{copy.no}</label>
      </fieldset>
      <div className="extension-interactions__actions">
        <button type="submit" data-action="answer" disabled={attempted || value === null}>{copy.submit}</button>
        <button type="button" data-action="cancel" disabled={attempted} onClick={cancel}>{copy.cancel}</button>
      </div>
      <p className="extension-interactions__warning">{copy.cancellationWarning}</p>
    </form>
  );
}

function InputInteraction({ active, language, attempted, onAnswer, onCancel }: InteractionFormProps): ReactElement {
  const copy = interactionCopy[language];
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
      <InteractionContext active={active} language={language} />
      <label htmlFor={labelId}>{copy.inputLabel}</label>
      <input id={labelId} type="text" aria-label={copy.inputLabel} value={text} placeholder={active.placeholder ?? copy.inputPlaceholder}
        disabled={attempted} aria-invalid={sizeError || undefined} aria-describedby={sizeError ? errorId : undefined}
        onChange={event => { setText(event.currentTarget.value); setSizeError(false); }} />
      {sizeError && <p id={errorId} role="alert" className="extension-interactions__warning">{copy.answerTooLarge}</p>}
      <div className="extension-interactions__actions">
        <button type="submit" data-action="answer" disabled={attempted}>{copy.submit}</button>
        <button type="button" data-action="cancel" disabled={attempted} onClick={cancel}>{copy.cancel}</button>
      </div>
      <p className="extension-interactions__warning">{copy.cancellationWarning}</p>
    </form>
  );
}
function EditorInteraction({ active, language, attempted, onAnswer, onCancel }: InteractionFormProps): ReactElement {
  const copy = interactionCopy[language];
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
      <InteractionContext active={active} language={language} />
      <label htmlFor={labelId}>{copy.editorLabel}</label>
      <textarea id={labelId} aria-label={copy.editorLabel} rows={6} value={text} disabled={attempted}
        aria-invalid={sizeError || undefined} aria-describedby={sizeError ? errorId : undefined}
        onChange={event => { setText(event.currentTarget.value); setSizeError(false); }} />
      {sizeError && <p id={errorId} role="alert" className="extension-interactions__warning">{copy.answerTooLarge}</p>}
      <div className="extension-interactions__actions">
        <button type="submit" data-action="answer" disabled={attempted}>{copy.submit}</button>
        <button type="button" data-action="cancel" disabled={attempted} onClick={cancel}>{copy.cancel}</button>
      </div>
      <p className="extension-interactions__hint">{language === "en" ? "Press Ctrl+Enter to submit; Enter adds a new line." : "按 Ctrl+Enter 提交；按 Enter 换行。"}</p>
      <p className="extension-interactions__warning">{copy.cancellationWarning}</p>
    </form>
  );
}
export interface ExtensionInteractionsProps {
  state: ExtensionInteractionProjection;
  language: Language;
  onAnswer(id: string, answer: InteractionAnswer): void;
  onCancel(id: string): void;
}

export function ExtensionInteractions({ state, language, onAnswer, onCancel }: ExtensionInteractionsProps): ReactElement {
  const copy = interactionCopy[language];
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
    language,
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
      <summary><h2 id={headingId}>{active !== null || interactionBlocked ? copy.heading : copy.feedbackHeading}</h2></summary>
      {interactionBlocked && <div role="alert" className="extension-interactions__error">
        <p>{copy.blocked}</p>
        {state.errorCode !== null && <p>{copy.errors[state.errorCode] ?? copy.unknownError}</p>}
      </div>}
      {form ?? <p role="status">{copy.empty}</p>}
      {state.queuedCount > 0 && <p role="status" className="extension-interactions__queue">{copy.queued(state.queuedCount)}</p>}
      <p className="extension-interactions__limitations">{copy.limitations}</p>
      {(state.feedback.length > 0 || state.omittedFeedback > 0) && <section className="extension-interactions__feedback" aria-label={copy.feedbackHeading}>
        <h3>{copy.feedbackHeading}</h3>
        {state.omittedFeedback > 0 && <p className="extension-interactions__omitted" role="status">{copy.omittedFeedback(state.omittedFeedback)}</p>}
        {state.feedback.length > 0 && <ul className="extension-interactions__feedback-list">
          {state.feedback.map(entry => <li key={entry.id} className={`extension-interactions__feedback-entry is-${entry.level}`}>
            <p className="extension-interactions__feedback-label">{copy.feedbackKinds[entry.kind]} · {copy.feedbackLevels[entry.level]}</p>
            <pre className="extension-interactions__feedback-text">{entry.text}</pre>
          </li>)}
        </ul>}
      </section>}
    </details>
  );
}
interface ExecutionProfileCopy {
  heading: string;
  controlled: string;
  trusted: string;
  badgeSeparator: string;
  phase: Readonly<Record<ExecutionProfileProjection["phase"], string>>;
  chooserNote: string;
  chooseControlled: string;
  chooseTrusted: string;
  coverageWarning: string;
  recoveryDomain: string;
  endWarning: string;
  endOwned: string;
  recoverControlled: string;
  error: string;
}

const executionProfileCopy: Record<Language, ExecutionProfileCopy> = {
  en: {
    heading: "Execution profile",
    controlled: "Controlled execution",
    trusted: "Trusted execution",
    badgeSeparator: " · ",
    phase: {
      idle: "Runtime is idle.",
      selecting: "Waiting for the VS Code file picker and host confirmation.",
      switching: "Changing execution profile. Controls are temporarily disabled.",
      "recovery-required": "Runtime outcome is uncertain. Reloading or seeing no process does not clear recovery.",
      error: "Execution profile is not ready.",
    },
    chooserNote: "Choosing trusted opens the native VS Code file picker and host confirmation before loading an extension.",
    chooseControlled: "Use controlled execution",
    chooseTrusted: "Load a trusted extension…",
    coverageWarning: "Trusted extension code is not a security sandbox. Its internal code and external effects are outside covered approval; covered tools still ask for approval.",
    recoveryDomain: "Only one runtime is admitted at a time in the shared recovery domain. Another VS Code window can remain blocked until the exact run is observed ended and deliberately recovered.",
    endWarning: "Ending an owned runtime may interrupt irreversible work. The host will ask for confirmation.",
    endOwned: "End owned runtime…",
    recoverControlled: "Recover controlled execution",
    error: "The host reported an execution-profile error. No profile change or recovery is implied.",
  },
  "zh-CN": {
    heading: "执行配置",
    controlled: "受控执行",
    trusted: "受信执行",
    badgeSeparator: " · ",
    phase: {
      idle: "运行时空闲。",
      selecting: "正在等待 VS Code 文件选择器和宿主确认。",
      switching: "正在切换执行配置；控件暂时禁用。",
      "recovery-required": "运行时结果不确定。重新加载或看不到进程都不能清除恢复状态。",
      error: "执行配置尚未就绪。",
    },
    chooserNote: "选择受信执行后，宿主会先打开 VS Code 原生文件选择器并请求确认，再加载扩展。",
    chooseControlled: "使用受控执行",
    chooseTrusted: "加载受信扩展…",
    coverageWarning: "受信扩展代码不在沙箱中；其内部代码和外部影响不受已覆盖的审批约束。已覆盖工具仍会请求审批。",
    recoveryDomain: "共享恢复域中同一时间只允许一个运行时。其他 VS Code 窗口可能会保持阻止，直到确认对应运行实例已结束并由用户明确恢复。",
    endWarning: "结束自有运行时可能中断不可逆工作；宿主会请求确认。",
    endOwned: "结束自有运行时…",
    recoverControlled: "恢复受控执行",
    error: "宿主报告了执行配置错误。不代表配置已切换或恢复已完成。",
  },
};

export interface ExecutionProfileControlsProps {
  state: ExecutionProfileProjection;
  language: Language;
  onChoose(profile: "controlled" | "trusted"): void;
  onEnd(): void;
  onRecover(): void;
}

export function ExecutionProfileControls({ state, language, onChoose, onEnd, onRecover }: ExecutionProfileControlsProps): ReactElement {
  const copy = executionProfileCopy[language];
  const headingId = useId();
  const isPending = state.phase === "selecting" || state.phase === "switching";
  const profileLabel = state.profile === "trusted" ? copy.trusted : copy.controlled;
  const badge = state.displayName === null ? profileLabel : `${profileLabel}${copy.badgeSeparator}${state.displayName}`;
  const disabledSwitch = !state.canSwitch || (state.phase !== "idle" && state.phase !== "error");
  const disabledLifecycleAction = isPending;
  return (
    <section className="execution-profile-controls" aria-labelledby={headingId}>
      <h2 id={headingId}>{copy.heading}</h2>
      <p className={`execution-profile-controls__badge is-${state.profile}`} data-profile-badge={state.profile}>{badge}</p>
      <p className="execution-profile-controls__phase" role={state.phase === "error" || state.phase === "recovery-required" ? "alert" : "status"}>
        {copy.phase[state.phase]}
      </p>
      {state.errorCode !== null && <p className="execution-profile-controls__error" role="alert">{copy.error}</p>}
      <p className="execution-profile-controls__coverage">{copy.coverageWarning}</p>
      <p className="execution-profile-controls__domain">{copy.recoveryDomain}</p>
      <p className="execution-profile-controls__chooser-note">{copy.chooserNote}</p>
      <div className="execution-profile-controls__actions">
        <button type="button" data-profile-choice="controlled" disabled={disabledSwitch} onClick={() => onChoose("controlled")}>
          {copy.chooseControlled}
        </button>
        <button type="button" data-profile-choice="trusted" disabled={disabledSwitch} onClick={() => onChoose("trusted")}>
          {copy.chooseTrusted}
        </button>
        <button type="button" data-action="end-owned-runtime" disabled={!state.canEnd || disabledLifecycleAction} onClick={onEnd}>
          {copy.endOwned}
        </button>
        <button type="button" data-action="recover-controlled-runtime" disabled={!state.canRecover || disabledLifecycleAction} onClick={onRecover}>
          {copy.recoverControlled}
        </button>
      </div>
      <p className="execution-profile-controls__end-warning">{copy.endWarning}</p>
    </section>
  );
}
