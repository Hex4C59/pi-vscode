import { useEffect, useRef, useState, type ReactElement } from "react";
import { useUiText, type UiText } from "../../components/index.js";

const COPY_TIMEOUT_MS = 5000;

function useReplyClipboard(text: string): { notice: UiText | ""; pending: boolean; copy: () => Promise<void> } {
  const [result, setResult] = useState<{ text: string; notice: UiText }>();
  const setNotice = (notice: UiText | "") => setResult(notice ? { text, notice } : undefined);
  const request = useRef(0);
  const mounted = useRef(true);
  const pending = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const currentText = useRef(text);
  currentText.current = text;
  useEffect(() => {
    mounted.current = true;
    pending.current = false;
    setNotice("");
    return () => { mounted.current = false; request.current++; clearTimeout(timeout.current); };
  }, [text]);
  const current = (id: number) => mounted.current && request.current === id && currentText.current === text;
  const copy = async (): Promise<void> => {
    if (pending.current) return;
    const id = ++request.current;
    if (!navigator.clipboard?.writeText) {
      setNotice("Clipboard unavailable — select the reply to copy manually.");
      return;
    }
    pending.current = true;
    setNotice("Copying reply…");
    timeout.current = setTimeout(() => {
      if (!current(id)) return;
      request.current++;
      pending.current = false;
      setNotice("Copy timed out — clipboard completion is unknown. You can retry or copy manually.");
    }, COPY_TIMEOUT_MS);
    try {
      await navigator.clipboard.writeText(text);
      if (current(id)) setNotice("Reply copied.");
    } catch {
      if (current(id)) setNotice("Copy failed — clipboard permission is denied or unavailable. Select the reply to copy manually.");
    } finally {
      if (current(id)) { pending.current = false; clearTimeout(timeout.current); }
    }
  };
  const notice = result?.text === text ? result.notice : "";
  return { notice, pending: notice === "Copying reply…", copy };
}

/** Copies only the qualified safe body supplied by the conversation projection. */
export function ReplyCopy({ text }: { text: string }): ReactElement {
  const { text: t } = useUiText();
  const { notice, pending, copy } = useReplyClipboard(text);
  return <div className="candidate__reply-copy">
    <span role="status">{notice ? t(notice) : ""}</span>
    <button type="button" aria-label={t("Copy reply")} aria-disabled={pending} onClick={() => { void copy(); }}>{t("Copy reply")}</button>
  </div>;
}
