import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactElement, type RefObject } from "react";
import type { CommandCatalogueRow, CommandCatalogueStateMessage } from "../../../extension/contracts/index.js";
import { useUiText } from "../../components/index.js";

export type CommandInputProps = {
  text: string;
  input: RefObject<HTMLTextAreaElement | null>;
  catalogue: CommandCatalogueStateMessage | null;
  disabled: boolean;
  readOnly: boolean;
  blocked: boolean;
  completionDisabled: boolean;
  taskRunning: boolean;
  onEdit: (text: string) => void;
  onComplete: (name: string) => void;
  onOpen: () => void;
  submit: () => void;
};

function useCommandInput(props: CommandInputProps) {
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex] = useState(0);
  const [caret, setCaret] = useState(props.text.length);
  const token = /^\/[^\s/]*/.exec(props.text)?.[0];
  const rows = props.catalogue?.status === "ready" ? props.catalogue.rows.filter(row => row.name.toLowerCase().includes((token ?? "").slice(1).toLowerCase())) : [];
  const open = focused && !dismissed && !props.blocked && !props.disabled && !props.readOnly && !!token && caret <= token.length;
  const active = Math.min(index, Math.max(0, rows.length - 1));
  useEffect(() => { if (props.blocked) setDismissed(true); }, [props.blocked]);
  const complete = (name: string) => {
    if (props.completionDisabled) return;
    setDismissed(true); props.onComplete(name);
    props.input.current?.focus({ preventScroll: true });
  };
  const key = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
    if (open && event.key === "Escape") { event.preventDefault(); setDismissed(true); return; }
    if (open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault(); setIndex((active + (event.key === "ArrowDown" ? 1 : -1) + rows.length) % (rows.length || 1)); return;
    }
    if (open && !event.shiftKey && (event.key === "Enter" || (event.key === "Tab" && rows.length))) {
      event.preventDefault(); if (rows[active]) complete(rows[active].name); return;
    }
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); if (!props.taskRunning) props.submit(); }
  };
  return { open, rows, active, key, complete,
    focus: () => { setFocused(true); if (token) props.onOpen(); },
    blur: () => setFocused(false),
    select: () => setCaret(props.input.current?.selectionStart ?? 0),
    edit: (text: string, position: number) => {
      setDismissed(false); setIndex(0); setCaret(position); props.onEdit(text);
      if (text.startsWith("/")) props.onOpen();
    },
  };
}

function CommandRow({ row, active, id, disabled, onComplete }: {
  row: CommandCatalogueRow; active: boolean; id: string; disabled: boolean; onComplete: () => void;
}): ReactElement {
  const { text: t } = useUiText();
  const source = row.source === "extension" ? t("Extension") : row.source === "prompt" ? t("Prompt template") : t("Skill");
  const location = row.location === "project" ? t("Project") : row.location === "user" ? t("User") : row.location === "path" ? t("Custom path") : null;
  return <button id={id} type="button" role="option" aria-selected={active} tabIndex={-1}
    className="command-menu__row" disabled={disabled} onMouseDown={event => event.preventDefault()} onClick={onComplete}>
    <span className="command-menu__name">/{row.name}</span>
    <span className="command-menu__source">{source}{location ? ` · ${location}` : ""}</span>
    {row.description && <span className="command-menu__description">{row.description}</span>}
  </button>;
}

function CommandMenu({ id, catalogue, rows, active, disabled, complete }: {
  id: string; catalogue: CommandCatalogueStateMessage | null; rows: readonly CommandCatalogueRow[];
  active: number; disabled: boolean; complete: (name: string) => void;
}): ReactElement {
  const { text: t } = useUiText();
  const list = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: "nearest" }); }, [active]);
  const notice = !catalogue || catalogue.status === "loading" ? t("Loading commands…")
    : catalogue.status === "unavailable" ? t("Commands unavailable. Restart the runtime to reload.")
      : catalogue.status === "empty" ? t("No commands loaded in this runtime.") : !rows.length ? t("No matching commands.") : null;
  return <div className="command-menu">
    <div className="command-menu__heading">{t("Commands")}</div>
    {notice && <p className="command-menu__notice" role="status">{notice}</p>}
    <div id={id} ref={list} role="listbox" aria-label={t("Commands")} className="command-menu__list">
      {rows.map((row, index) => <CommandRow key={row.name} row={row} active={index === active}
        id={`${id}-${index}`} disabled={disabled} onComplete={() => complete(row.name)} />)}
    </div>
  </div>;
}

/** Local discovery only; completion is a named host operation on acknowledged draft text. */
export function CommandInput(props: CommandInputProps): ReactElement {
  const { text: t } = useUiText();
  const menu = useCommandInput(props);
  const id = useId();
  useLayoutEffect(() => {
    const node = props.input.current;
    if (node) { node.style.height = "auto"; node.style.height = `${Math.min(node.scrollHeight, 140)}px`; }
  }, [props.text, props.input]);
  return <>
    {menu.open && <CommandMenu id={id} catalogue={props.catalogue} rows={menu.rows} active={menu.active}
      disabled={props.completionDisabled} complete={menu.complete} />}
    <textarea ref={props.input} role="combobox" aria-label={t("Message")} aria-autocomplete="list"
      aria-haspopup="listbox" aria-expanded={menu.open} aria-controls={menu.open ? id : undefined}
      aria-activedescendant={menu.open && menu.rows.length ? `${id}-${menu.active}` : undefined}
      placeholder={t("Ask pi anything…")} rows={2} maxLength={8000} value={props.text}
      readOnly={props.readOnly} disabled={props.disabled} onFocus={menu.focus} onBlur={menu.blur}
      onSelect={menu.select} onChange={event => menu.edit(event.currentTarget.value, event.currentTarget.selectionStart)} onKeyDown={menu.key} />
  </>;
}
