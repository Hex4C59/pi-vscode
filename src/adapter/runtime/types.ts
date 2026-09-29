import type { RuntimeProcess } from "./process/types.js";
import type { access } from "node:fs/promises";
import type { resolvePiCliPath } from "./pi-rpc-probe.js";
import type { readPiStartupModelArg } from "./piStartupModel.js";

/** Explicit process strategy; omitted startup probes use production defaults. */
export type PiRpcRuntimeEnvironment = {
  process: RuntimeProcess;
  startupModel?: typeof readPiStartupModelArg;
  cliPath?: typeof resolvePiCliPath;
  gateAccess?: typeof access;
};
