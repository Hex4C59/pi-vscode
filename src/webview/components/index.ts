/** App-facing presentation entry; feature implementations live in chat/, ui/, and i18n/. */
export { WorkspaceSetup } from "../chat/workspace/workspace-setup.js";
export { ModelPickerView } from "../chat/composer/model-picker.js";
export { Approvals, SessionGrants } from "../chat/execution/approvals.js";
export { ChangeReview } from "../chat/execution/change-review.js";
export { SavedHistory } from "../chat/sessions/saved-history.js";
export { ChatPreviewContext, useChatPreview } from "../ui/chat-preview.js";
export type { ApprovalsProps, AttachmentPreview, AttachmentPanelProps, ChangeReviewProps, ModelPickerViewProps, SessionsProps, WorkspaceSetupAction, WorkspaceSetupProps, SavedHistoryProps } from "./types.js";
export { UiTextProvider, useUiText, englishUi, formatUiText } from "../i18n/ui-text.js";
export type { UiText, UiTranslator, UiLanguage } from "../i18n/ui-text.js";
