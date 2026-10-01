/** Named task occupancy for send, ACK, commands, agent, Stop, dialogs and approvals. */

export function createRpcOccupancy() {
  let promptInFlight = false;
  let promptAckPending = false;
  let commandInFlight = false;
  let agentRunning = false;
  let aborting = false;
  let outstandingDialogs = 0;
  const approvals = new Set<string>();
  let connection: object | null = null;
  let session = 0;

  return {
    bind(next: { connection: object; session: number }): void {
      connection = next.connection;
      session = next.session;
    },
    setSession(next: number): void {
      session = next;
    },
    beginPrompt(): void {
      promptInFlight = true;
    },
    beginSend(options: { command: boolean }): void {
      promptInFlight = true;
      promptAckPending = true;
      commandInFlight = options.command;
    },
    clearAck(expectedSession: number): void {
      if (session === expectedSession) promptAckPending = false;
    },
    rejectSend(expectedConnection: object | null): void {
      if (connection === expectedConnection) promptInFlight = false;
    },
    finishCommand(expectedConnection: object | null): void {
      if (connection !== expectedConnection) return;
      commandInFlight = false;
      promptInFlight = agentRunning;
    },
    noteAgentStarted(): void {
      agentRunning = true;
    },
    noteAgentSettled(): void {
      agentRunning = false;
      promptInFlight = commandInFlight;
      // Stop owns this fence until clear/abort/settlement observation finishes.
    },
    beginStopping(): void {
      aborting = true;
    },
    clearStopping(): void {
      aborting = false;
    },
    disconnectSend(): void {
      promptInFlight = false;
    },
    openDialog(): void {
      outstandingDialogs++;
    },
    closeDialog(expectedConnection: object | null): void {
      if (connection !== expectedConnection) return;
      outstandingDialogs = Math.max(0, outstandingDialogs - 1);
    },
    dialogs(): number {
      return outstandingDialogs;
    },
    addApproval(id: string): void {
      approvals.add(id);
    },
    removeApproval(id: string): void {
      approvals.delete(id);
    },
    approvalIds(): Iterable<string> {
      return approvals;
    },
    clearApprovals(): void {
      approvals.clear();
    },
    agentRunning(): boolean {
      return agentRunning;
    },
    allowsSend(): boolean {
      return !aborting && !promptInFlight && !promptAckPending;
    },
    allowsModelMutation(): boolean {
      return !promptInFlight;
    },
    allowsRestart(): boolean {
      return !aborting && !promptInFlight && !promptAckPending && !agentRunning && !commandInFlight
        && outstandingDialogs === 0 && approvals.size === 0;
    },
    classifyRelease(input: { forcedUncertain?: boolean; sessionActive: boolean }): "idle" | "uncertain" {
      return input.forcedUncertain || !input.sessionActive || promptInFlight || promptAckPending
        || commandInFlight || agentRunning || approvals.size > 0 || outstandingDialogs > 0
        ? "uncertain" : "idle";
    },
    sending(): boolean {
      return promptInFlight;
    },
    isStopping(): boolean {
      return aborting;
    },
    reset(): void {
      promptAckPending = false;
      promptInFlight = false;
      commandInFlight = false;
      agentRunning = false;
      aborting = false;
      outstandingDialogs = 0;
      approvals.clear();
      connection = null;
      session = 0;
    },
  };
}
