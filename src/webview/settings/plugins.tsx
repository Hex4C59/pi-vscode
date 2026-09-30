import type { PluginInventoryError, PluginInventoryProjection } from "../../extension/contracts/index.js";
import { useUiText, type UiText } from "../components/index.js";
import type { ReactElement } from "react";

const errors: Record<PluginInventoryError, UiText> = {
  "duplicate-path": "This plugin is already in the inventory.",
  "invalid-entry": "That file cannot be added as a pi extension.",
  "existing-unusable": "The plugin inventory file is damaged or too large and was left unchanged.",
  "unknown-entry": "That plugin is no longer in the inventory.",
  "too-many": "The plugin inventory is full.",
  "too-large": "The plugin inventory would exceed its size limit.",
  "write-failed": "The plugin inventory could not be saved.",
};

export function PluginsPanel({
  inventory,
  onAdd,
  onRemove,
}: {
  inventory: PluginInventoryProjection | null;
  onAdd(): void;
  onRemove(id: string): void;
}): ReactElement {
  const { text: t } = useUiText();
  if (!inventory) return <p role="status">{t("Loading plugins…")}</p>;
  return <PluginsBody inventory={inventory} onAdd={onAdd} onRemove={onRemove} />;
}

function PluginsBody({
  inventory,
  onAdd,
  onRemove,
}: {
  inventory: PluginInventoryProjection;
  onAdd(): void;
  onRemove(id: string): void;
}): ReactElement {
  const { text: t } = useUiText();
  const blocked = inventory.busy || inventory.error === "existing-unusable" || inventory.error === "too-many";
  return <>
    {inventory.error && <p className="settings-page__error" role="alert">{t(errors[inventory.error])}</p>}
    {inventory.entries.length > 0 && <p className="settings-page__muted">{t("Remove forgets the path. Files on disk stay.")}</p>}
    <div className="settings-page__actions">
      <button className="settings-page__button" type="button" disabled={blocked}
        aria-busy={inventory.busy} onClick={onAdd}>{t(inventory.busy ? "Adding plugin…" : "Add from disk")}</button>
    </div>
    <div className="settings-page__plugins" aria-label={t("Plugins")} aria-busy={inventory.busy}>
      {inventory.entries.map(entry => <div className="settings-page__row" key={entry.id}>
        <span>{entry.displayName}</span>
        <button className="settings-page__button" type="button" disabled={blocked}
          onClick={() => onRemove(entry.id)}>{t("Remove")}</button>
      </div>)}
      {!inventory.entries.length && <p role="status">{t(inventory.busy ? "Adding plugin…" : "No plugins in this inventory.")}</p>}
    </div>
  </>;
}
