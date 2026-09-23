import type { spawn } from "node:child_process";
import type { access } from "node:fs/promises";
import type { resolvePiCliPath } from "./pi-rpc-probe.js";
import type { readPiStartupModelArg } from "./piStartupModel.js";

/** Host-injected process and startup probes; omission selects the production defaults. */
export type PiRpcRuntimeEnvironment = {
  spawn?: typeof spawn;
  startupModel?: typeof readPiStartupModelArg;
  cliPath?: typeof resolvePiCliPath;
  gateAccess?: typeof access;
};
