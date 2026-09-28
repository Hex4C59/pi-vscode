export type ExtensionSelection = { kind: "selected"; entryPath: string; displayName: string } | { kind: "cancelled" | "stale" | "invalid-entry" };
export type ExtensionSelectionUi = { pick(): Promise<string | undefined>; confirm(canonicalPath: string): Promise<boolean> };
