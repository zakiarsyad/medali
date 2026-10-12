const MINUTE = 60 * 1000;
/** A session ends after this long without a page or an action. */
const IDLE_LIMIT = 8 * 60 * MINUTE;
/**
 * "Last used" is written at most this often for one session, so that
 * opening pages does not write to the database every time.
 */
const WRITE_EVERY = 5 * MINUTE;

function idleTime(lastSeenAt: Date, now: Date): number {
  return now.getTime() - lastSeenAt.getTime();
}

/** Whether a session was left unused for too long, and has ended. */
export function sessionExpired(lastSeenAt: Date, now: Date): boolean {
  return idleTime(lastSeenAt, now) >= IDLE_LIMIT;
}

/** The time from which, and before, a "last used" means expired. */
export function expiredBefore(now: Date): Date {
  return new Date(now.getTime() - IDLE_LIMIT);
}

export function lastSeenNeedsWriting(lastSeenAt: Date, now: Date): boolean {
  return idleTime(lastSeenAt, now) >= WRITE_EVERY;
}
