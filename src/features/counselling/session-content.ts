import type { counsellingSessions } from "@/db/schema";
import type { SessionContent } from "./session-ids";

type StoredSession = typeof counsellingSessions.$inferSelect;

/** What a stored session holds, as its log keeps it. */
export function contentOf(session: StoredSession): SessionContent {
  return {
    day: session.day,
    kind: session.kind,
    topic: session.topic,
    notes: session.notes,
    followUp: session.followUp,
    nextDay: session.nextDay,
  };
}

const CONTENT_KEYS: readonly (keyof SessionContent)[] = [
  "day",
  "kind",
  "topic",
  "notes",
  "followUp",
  "nextDay",
];

/** Whether two contents of a session are the same in every part. */
export function isSameContent(
  one: SessionContent,
  other: SessionContent,
): boolean {
  return CONTENT_KEYS.every((key) => one[key] === other[key]);
}
