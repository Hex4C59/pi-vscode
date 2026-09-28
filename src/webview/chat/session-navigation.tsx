import { SessionIcon } from "./session-icon.js";
import type { ReactElement, RefObject } from "react";
import { availability, type ClientSnapshot, type WebviewClient } from "../index.js";
import { useUiText } from "../components/index.js";
import { InterfaceSettings } from "./interface-settings.js";
import type { UiLanguageState } from "./types.js";

type NavigationProps = {
  snapshot: ClientSnapshot;
  client: Pick<WebviewClient, "action" | "newConversation">;
  language: UiLanguageState;
  canBrowse: boolean;
  canCompose: boolean;
  historyOpen: boolean;
  historyId: string;
  browse: RefObject<HTMLButtonElement | null>;
  onBrowse: () => void;
  settingsOpenRequest: number;
};

/** Navigation and global settings intents; transcript scroll restoration stays with the page. */
export function SessionNavigation({ snapshot, client, language, canBrowse, canCompose, historyOpen, historyId, browse, onBrowse, settingsOpenRequest }: NavigationProps): ReactElement {
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
      <InterfaceSettings
        language={language}
        openRequest={settingsOpenRequest}
        sessionModel={snapshot.workspace?.chatModel}
        executionProfile={snapshot.executionProfile}
        providerConfig={snapshot.providerConfig}
        onChooseProfile={profile => client.action({ type: "chooseExecutionProfile", profile })}
        onEndRuntime={() => client.action({ type: "endOwnedRuntime" })}
        onRecoverRuntime={() => client.action({ type: "recoverControlledRuntime" })}
        onAddApiKey={providerId => client.action({ type: "openProviderApiKey", providerId })}
        onLogoutProvider={providerId => client.action({ type: "logoutProvider", providerId })}
        onSetDefaultModel={(provider, modelId) => client.action({ type: "setDefaultModel", provider, modelId })}
        onRefreshProviders={() => client.action({ type: "refreshProviderConfig" })}
      />
    </nav>;
}
