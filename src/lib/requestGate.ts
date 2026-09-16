export type RequestGate = { version: number };

export function createRequestGate(): RequestGate {
  return { version: 0 };
}

export function beginRequest(gate: RequestGate): number {
  gate.version += 1;
  return gate.version;
}

export function isCurrentRequest(gate: RequestGate, token: number): boolean {
  return gate.version === token;
}

export function invalidateRequests(gate: RequestGate): void {
  gate.version += 1;
}
