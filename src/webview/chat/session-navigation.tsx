import { SessionIcon } from "./session-icon.js";
import type { ReactElement, RefObject } from "react";
import { availability, type ClientSnapshot, type WebviewClient } from "../index.js";
import { useUiText } from "../components/index.js";

type NavigationProps = {
  snapshot: ClientSnapshot;
  client: Pick<WebviewClient, "action" | "newConversation">;
  canBrowse: boolean;
  canCompose: boolean;
  historyOpen: boolean;
  historyId: string;
  browse: RefObject<HTMLButtonElement | null>;
  onBrowse: () => void;
};

/** Navigation and global settings intents; transcript scroll restoration stays with the page. */
export function SessionNavigation({ snapshot, client, canBrowse, canCompose, historyOpen, historyId, browse, onBrowse }: NavigationProps): ReactElement {
  const { text: t } = useUiText();
  const controls = availability(snapshot);
  return <nav className="candidate__navigation" aria-label={t("Conversation navigation")}>
      <span className="candidate__current" aria-label={t("Current conversation")} title={snapshot.sessions?.current?.name ?? undefined}>{snapshot.sessions?.current?.name}</span>
      <button className="candidate__icon session-icon-button" type="button" aria-label={t("Browse saved conversations")} title={t("Chat history")} disabled={!canBrowse} ref={browse} aria-expanded={historyOpen} aria-controls={historyId}
        onClick={onBrowse}>
        <SessionIcon name="clock" />
      </button>
      <button className="candidate__icon session-icon-button" type="button" aria-label={t("New conversation")} title={t("New conversation")} disabled={!canCompose || controls.sessionTransitioning || snapshot.sessions?.phase === "listing"}
        onClick={event => { event.currentTarget.focus(); client.newConversation(); }}>
        <SessionIcon name="plus" />
      </button>
      <button className="candidate__icon session-icon-button" type="button" disabled={!snapshot.workspace}
        aria-label={t("Interface settings")} title={t("Interface settings")} onClick={() => client.action({ type: "openSettings" })}>
        <SessionIcon name="settings" />
      </button>
    </nav>;
}
