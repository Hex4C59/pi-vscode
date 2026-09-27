import { useUiText, type UiText } from "../components/index.js";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Lexer, type Token, type MarkedToken } from "marked";

/** Only explicit browser HTTP(S) navigation; never a host intent or embedded request. */
function safeLink(href: string): string | undefined {
  try {
    const url = new URL(href);
    if ((url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password) return url.href;
  } catch { /* Relative and malformed destinations have no preview authority. */ }
  return undefined;
}

function CodeBlock({ text }: { text: string }): ReactNode {
  const { text: t } = useUiText();
  const [result, setResult] = useState<{ text: string; message: UiText }>();
  const mounted = useRef(true);
  const request = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current++; clearTimeout(timeout.current); };
  }, []);
  const copy = async (): Promise<void> => {
    const id = ++request.current;
    clearTimeout(timeout.current);
    if (!navigator.clipboard?.writeText) {
      setResult({ text, message: "Clipboard unavailable — select the code to copy manually." });
      return;
    }
    setResult({ text, message: "Copying code…" });
    timeout.current = setTimeout(() => {
      request.current++;
      setResult({ text, message: "Copy timed out — clipboard completion is unknown. You can retry or copy manually." });
    }, 5000);
    try {
      await navigator.clipboard.writeText(text);
      if (mounted.current && request.current === id) setResult({ text, message: "Code copied." });
    } catch {
      if (mounted.current && request.current === id) setResult({ text, message: "Copy failed — clipboard permission is denied or unavailable. Select the code to copy manually." });
    } finally {
      if (request.current === id) clearTimeout(timeout.current);
    }
  };
  return <div className="candidate__code">
    <div className="candidate__code-actions"><button type="button" aria-label={t("Copy code")} onClick={() => { void copy(); }}>{t("Copy")}</button>
      <span role="status">{result?.text === text ? t(result.message) : ""}</span></div>
    <pre tabIndex={0} aria-label={t("Code block")}><code>{text}</code></pre>
  </div>;
}

function ReplyLink({ href, children }: { href: string; children: ReactNode }): ReactNode {
  const { text: t } = useUiText();
  const destination = safeLink(href);
  const [notice, setNotice] = useState<UiText | "">("");
  if (!destination) return <span aria-label={t("Blocked link")}>{children} <span className="candidate__notice">{t("(Link blocked — only absolute HTTP(S) links without credentials are available in this preview.)")}</span></span>;
  return <><a href={destination} target="_blank" rel="noopener noreferrer" onClick={() => setNotice("Opening an external browser tab; native host routing is not available in this preview.")}>{children}</a><span className="candidate__notice" role="status">{notice ? t(notice) : ""}</span></>;
}

function renderTokens(tokens: readonly Token[]): ReactNode {
  return tokens.map((entry, index) => {
    // This lexer has no extensions: all nested tokens are built-in MarkedToken variants.
    const token = entry as MarkedToken;
    let content: ReactNode;
    switch (token.type) {
      case "space": content = null; break;
      case "heading": {
        const Heading = `h${token.depth}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
        content = <Heading>{renderTokens(token.tokens)}</Heading>;
        break;
      }
      case "paragraph": content = <p>{renderTokens(token.tokens)}</p>; break;
      case "list": {
        const items = token.items.map((item: { tokens: Token[] }, i: number) => <li key={i}>{renderTokens(item.tokens)}</li>);
        content = token.ordered ? <ol start={token.start || 1}>{items}</ol> : <ul>{items}</ul>;
        break;
      }
      case "code": content = <CodeBlock text={token.text} />; break;
      case "codespan": content = <code>{token.text}</code>; break;
      case "text": content = token.tokens ? renderTokens(token.tokens) : token.text; break;
      case "escape": content = token.text; break;
      case "strong": content = <strong>{renderTokens(token.tokens)}</strong>; break;
      case "em": content = <em>{renderTokens(token.tokens)}</em>; break;
      case "br": content = <br />; break;
      case "link": {
        content = <ReplyLink href={token.href}>{renderTokens(token.tokens)}</ReplyLink>;
        break;
      }
      // HTML, images and unsupported constructs remain literal. No HTML parser or resource elements.
      default: content = token.raw;
    }
    return <Fragment key={index}>{content}</Fragment>;
  });
}

/** Preview-only assistant body. Approval input and attachment snapshots never call this Module. */
export function ReplyMarkdown({ text }: { text: string }): ReactNode {
  return <div className="candidate__markdown">{renderTokens(Lexer.lex(text, { gfm: false }))}</div>;
}
