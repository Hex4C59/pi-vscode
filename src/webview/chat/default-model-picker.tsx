import type { ReactElement } from "react";
import type { ProviderConfigProjection } from "../../extension/contracts/index.js";
import { ModelPickerView } from "../components/index.js";

/** Before a project session exists, choices belong to host-owned pi defaults. */
export function DefaultModelPicker({ config, disabled, onSelect, onThinking, onSettings }: {
  config: ProviderConfigProjection | null; disabled: boolean;
  onSelect(provider: string, modelId: string): void;
  onThinking(provider: string, modelId: string, level: string): void;
  onSettings(): void;
}): ReactElement {
  return <ModelPickerView disabled={disabled} continuousThinkingDrag animatePopover
    loading={!config || config.busy} onSettings={onSettings} onModel={onSelect}
    onThinking={level => {
      if (config?.defaultProvider && config.defaultModelId) onThinking(config.defaultProvider, config.defaultModelId, level);
    }}
    state={{
      chatModel: config?.defaultProvider && config.defaultModelId ? `${config.defaultProvider} / ${config.defaultModelId}` : null,
      thinkingLevel: config?.defaultThinkingLevel ?? null, thinkingLevels: config?.thinkingLevels ?? [],
      availableModels: config?.catalog ?? [], modelError: config?.error ?? null,
      modelBusy: !config || config.busy, chatBusy: false, pendingModel: null, pendingThinkingLevel: null,
    }} />;
}
