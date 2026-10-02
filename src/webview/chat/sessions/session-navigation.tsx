import { SessionIcon } from "./session-icon.js";
import type { ReactElement, RefObject } from "react";
import { useUiText } from "../../components/index.js";

type NavigationProps = {
  conversationName: string | undefined;
  renameDisabled: boolean;
  onRename: () => void;
  canBrowse: boolean;
  newConversationDisabled: boolean;
  settingsDisabled: boolean;
  historyOpen: boolean;
  historyId: string;
  browse: RefObject<HTMLButtonElement | null>;
  onBrowse: () => void;
  onNewConversation: () => void;
  onOpenSettings: () => void;
};

/** Navigation chrome; transcript scroll restoration and session intents stay with the page. */
export function SessionNavigation({ conversationName, renameDisabled, onRename, canBrowse, newConversationDisabled, settingsDisabled, historyOpen, historyId, browse, onBrowse, onNewConversation, onOpenSettings }: NavigationProps): ReactElement {
  const { text: t } = useUiText();
  return <nav className="candidate__navigation" aria-label={t("Conversation navigation")}>
      <button className="candidate__current" type="button" aria-label={t("Rename current conversation")} title={conversationName}
        disabled={renameDisabled} onClick={onRename}><span aria-label={t("Current conversation")}>{conversationName}</span></button>
      <button className="candidate__icon session-icon-button" type="button" aria-label={t("Browse saved conversations")} title={t("Chat history")} disabled={!canBrowse} ref={browse} aria-expanded={historyOpen} aria-controls={historyId}
        onClick={onBrowse}>
        <SessionIcon name="clock" />
      </button>
      <button className="candidate__icon session-icon-button" type="button" aria-label={t("New conversation")} title={t("New conversation")} disabled={newConversationDisabled}
        onClick={event => { event.currentTarget.focus(); onNewConversation(); }}>
        <SessionIcon name="plus" />
      </button>
      <button className="candidate__icon session-icon-button" type="button" disabled={settingsDisabled}
        aria-label={t("Interface settings")} title={t("Interface settings")} onClick={onOpenSettings}>
        <SessionIcon name="settings" />
      </button>
    </nav>;
}
