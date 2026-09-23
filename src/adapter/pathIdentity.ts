import path from "node:path";

/** Compare native absolute path spelling without folding potentially case-sensitive components.
 * VS Code URI and pi may differ in the Windows drive's case. Callers still own filesystem validation. */
export function sameNativePath(left: string, right: string): boolean {
  if (!path.isAbsolute(left) || !path.isAbsolute(right)) return false;
  const normalize = (value: string): string => {
    const normalized = path.normalize(value);
    const trimmed = normalized.length > path.parse(normalized).root.length ? normalized.replace(/[\\/]+$/, "") : normalized;
    return process.platform === "win32" ? trimmed.replace(/^[A-Za-z]:/, drive => drive.toLowerCase()) : trimmed;
  };
  return normalize(left) === normalize(right);
}
