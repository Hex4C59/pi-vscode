/** pi 0.86.1 README: PI_OFFLINE disables startup network operations, not inference.
 * Also prevents automatic missing-package installation during resource resolution.
 * Kept after inherited environment so user settings cannot reopen that path.
 */
export function controlledEnvironment(env: NodeJS.ProcessEnv, gateId: string): NodeJS.ProcessEnv {
  return {...env, PI_OFFLINE:'1', PI_TELEMETRY:'0', PI_VSCODE_GATE_ID:gateId};
}
