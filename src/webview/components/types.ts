import type {
  WorkspaceStateMessage, ApprovalDecision, AttachmentHistoryEntry,
  AttachmentStateMessage, ChangeReviewStateMessage, SessionStateMessage,
  SavedHistoryStateMessage, ProviderConfigProjection, SavedSessionSearch,
} from "../../extension/contracts/index.js";
import type { SavedHistoryPreview } from "../index.js";

/** Props are presentation-only; host intents and projections are owned by extension/contracts. */
export interface ApprovalsProps {
  /** Candidate presentation: select one request; authorization stays host-owned. */
  compact?: boolean;
  showGrants?: boolean;
  cards: WorkspaceStateMessage["approvals"];
  grants: WorkspaceStateMessage["grants"];
  disabled: boolean;
  onDecision: (id: string, decision: ApprovalDecision) => void;
  onRevoke: (id: string) => void;
}

export interface AttachmentPreview {
  snapshotId: string;
  text: string;
  error: string | null;
}

export interface AttachmentPanelProps {
  pageSize: number;
  state: AttachmentStateMessage | null;
  history: AttachmentHistoryEntry[];
  historyOpen: boolean;
  historyPage: number | null;
  preview: AttachmentPreview | null;
  disabled: boolean;
  status: string;
  onAdd: () => void;
  onAddSelection: () => void;
  onRemove: (attachmentId: string) => void;
  onConfirm: (attachmentId: string) => void;
  onHistory: () => void;
  onHistoryPage: (page: number) => void;
  onPreview: (snapshotId: string) => void;
  onClosePreview: () => void;
}

export interface ChangeReviewProps {
  pageSize: number;
  state: ChangeReviewStateMessage | null;
  open: boolean;
  page: number;
  onToggle: () => void;
  onPage: (page: number) => void;
  onDiff: (id: string) => void;
  onSource: (id: string) => void;
}

type LiveModelControlState = Pick<WorkspaceStateMessage, "thinkingLevel" | "pendingThinkingLevel" | "thinkingLevels" | "modelBusy" | "chatBusy" | "chatModel" | "pendingModel" | "availableModels" | "modelError" | "busy" | "runtime" | "execution">;

/** Callers pass either a live workspace slice or a saved default. The view does not choose the intent. */
export type ModelPickerViewProps = {
  onSettings?: () => void;
  loading?: boolean;
  disabled: boolean;
  onModel: (provider: string, modelId: string) => void;
  onThinking: (level: string) => void;
  continuousThinkingDrag?: boolean;
  animatePopover?: boolean;
} & (
  | { state: LiveModelControlState; savedDefault?: undefined }
  | { savedDefault: ProviderConfigProjection | null; state?: undefined }
) & {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export interface SessionsProps {
  onSearch?: (search: SavedSessionSearch) => void;
  pageSize: number;
  state: SessionStateMessage | null;
  onOpen: () => void;
  onRefresh: () => void;
  onPage: (page: number) => void;
  onNew: () => void;
  onResume: (id: string) => void;
}

export type WorkspaceSetupAction =
  | { type: "openFolder" }
  | { type: "manageTrust" }
  | { type: "chooseResources"; choice: "allow" | "decline" };

export interface WorkspaceSetupProps {
  state: WorkspaceStateMessage;
  onAction: (action: WorkspaceSetupAction) => void;
}

export interface SavedHistoryProps {
  pageSize: number;
  state: SavedHistoryStateMessage;
  pendingPage: number | null;
  preview: SavedHistoryPreview | null;
  disabled: boolean;
  onPage: (page: number) => void;
  onPreview: (id: string) => void;
  onPreviewPage: (direction: "first" | "previous" | "next" | "retry") => void;
  onClosePreview: () => void;
  onInteract: () => void;
}
