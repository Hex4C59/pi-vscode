import type { InteractionAnswer, InteractionFormProjection } from "../interactions/index.js";
export type { InteractionAnswer, InteractionFormProjection } from "../interactions/index.js";

export type ExtensionFeedback = {
  id: string;
  kind: "notify" | "status" | "widget" | "title" | "editor-text";
  level: "info" | "warning" | "error";
  text: string;
};
export type ExtensionInteractionProjection = {
  active: InteractionFormProjection | null;
  queuedCount: number;
  phase: "idle" | "waiting" | "blocked";
  errorCode: string | null;
  feedback: ExtensionFeedback[];
  omittedFeedback: number;
};
export type ExecutionProfileProjection = {
  profile: "controlled" | "trusted";
  displayName: string | null;
  phase: "idle" | "selecting" | "switching" | "recovery-required" | "error";
  errorCode: string | null;
  canSwitch: boolean;
  canEnd: boolean;
  canRecover: boolean;
};
export type ExtensionInteractionIntent =
  | { type: "answerInteraction"; id: string; answer: InteractionAnswer }
  | { type: "cancelInteraction"; id: string }
  | { type: "chooseExecutionProfile"; profile: "controlled" | "trusted" }
  | { type: "endOwnedRuntime" }
  | { type: "recoverControlledRuntime" };
