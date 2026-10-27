import { count, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import type { SentGroup } from "./proof-counts";
import { PROOF_KINDS } from "./proof-kinds";
import {
  campusDayOf,
  keepsFile,
  PROOF_SOURCES,
  type ProofSource,
} from "./proof-sources";

/**
 * The kept files of one kind, counted by status, day sent, removed
 * schedule and mark, so the database sends a few lines however many
 * files there are.
 */
async function groupsOf(
  db: Database,
  source: ProofSource,
): Promise<SentGroup[]> {
  const { status, isScheduleRemoved } = source;
  const sentOn = campusDayOf(source.sentAt);
  const isMarked = sql<boolean>`${source.removedAt} is not null`;
  const rows = await db
    .select({ status, sentOn, isScheduleRemoved, isMarked, files: count() })
    .from(source.table)
    .where(keepsFile(source))
    .groupBy(status, sentOn, isScheduleRemoved, isMarked);
  return rows.map((row) => ({ kind: source.kind, ...row }));
}

/** The kept files of every kind, counted as `groupsOf` does. */
export async function readSentGroups(db: Database): Promise<SentGroup[]> {
  const kinds = PROOF_KINDS.map((kind) => groupsOf(db, PROOF_SOURCES[kind]));
  return (await Promise.all(kinds)).flat();
}
