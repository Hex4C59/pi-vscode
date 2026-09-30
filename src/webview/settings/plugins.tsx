import type { PluginInventoryError, PluginInventoryProjection } from "../../extension/contracts/index.js";
import { useUiText, type UiText } from "../components/index.js";
import type { ReactElement } from "react";

const errors: Record<PluginInventoryError, UiText> = {
  "duplicate-path": "This plugin is already in the inventory.",
  "invalid-entry": "That file cannot be added as a pi extension.",
  "existing-unusable": "The plugin inventory file is damaged or too large and was left unchanged.",
  "too-many": "The plugin inventory is full.",
  "too-large": "The plugin inventory would exceed its size limit.",
  "write-failed": "The plugin inventory could not be saved.",
};

export function PluginsPanel({
  inventory,
  onAdd,
}: {
  inventory: PluginInventoryProjection | null;
  onAdd(): void;
}): ReactElement {
  const { text: t } = useUiText();
  if (!inventory) return <p role="status">{t("Loading plugins…")}</p>;
  return <PluginsBody inventory={inventory} onAdd={onAdd} />;
}

function PluginsBody({
  inventory,
  onAdd,
}: {
  inventory: PluginInventoryProjection;
  onAdd(): void;
}): ReactElement {
  const { text: t } = useUiText();
  const blocked = inventory.busy || inventory.error === "existing-unusable" || inventory.error === "too-many";
  return <>
    {inventory.error && <p className="settings-page__error" role="alert">{t(errors[inventory.error])}</p>}
    <div className="settings-page__actions">
      <button className="settings-page__button" type="button" disabled={blocked}
        aria-busy={inventory.busy} onClick={onAdd}>{t(inventory.busy ? "Adding plugin…" : "Add from disk")}</button>
    </div>
    <div className="settings-page__plugins" aria-label={t("Plugins")} aria-busy={inventory.busy}>
      {inventory.entries.map((entry, index) => <div className="settings-page__row" key={`${index}:${entry.displayName}`}>
        <span>{entry.displayName}</span>
      </div>)}
      {!inventory.entries.length && <p role="status">{t(inventory.busy ? "Adding plugin…" : "No plugins in this inventory.")}</p>}
    </div>
  </>;
}
