export type PendingToggle = { id: string; checked: boolean };

export type NetworkReachability = {
  isConnected?: boolean | null;
  isInternetReachable?: boolean | null;
};

/**
 * Keep only the final desired state for each shopping item.
 * Replaying the queue after reconnect is therefore idempotent with respect to
 * repeated local check/uncheck gestures on the same item.
 */
export function compactPendingToggleQueue(current: PendingToggle[], next: PendingToggle): PendingToggle[] {
  return [...current.filter((item) => item.id !== next.id), next];
}

/**
 * Expo can briefly report an unknown internet reachability while the active
 * connection is already restored. Treat an explicitly unreachable state as
 * offline, but allow a connected/unknown state to trigger a safe replay.
 */
export function isNetworkReachable(state: NetworkReachability): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
}

/**
 * Replay once on the first reachable observation and once for every later
 * offline -> reachable transition. Repeated online events do not re-fire.
 */
export function replayBelongsToCurrentUser(expectedUserId: string, currentUserId: string | null): boolean {
  return !!expectedUserId && expectedUserId === currentUserId;
}

export function shouldReplayShoppingQueue(previousReachable: boolean | null, state: NetworkReachability): boolean {
  return isNetworkReachable(state) && previousReachable !== true;
}

/** Keep pending local intentions visible until the backend confirms them. */
export function overlayPendingToggles<T extends { id: string; checked: boolean }>(items: T[], pending: PendingToggle[]): T[] {
  if (!pending.length) return items;
  const desired = new Map(pending.map((item) => [item.id, item.checked] as const));
  return items.map((item) => desired.has(item.id) ? { ...item, checked: desired.get(item.id)! } : item);
}

export function shoppingQueueStorageKey(householdId: string, weekStart: string, userId: string): string {
  return `notre-table:shopping-queue:${householdId}:${weekStart}:${userId}`;
}
