import { asc, eq, sql } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormViolationChanges, dormViolations } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import {
  parseViolations,
  type SentViolations,
  type ViolationRowInput,
  type ViolationsInput,
} from "./violation-input";
import {
  LIST_ALREADY_SENT,
  NOT_ALLOWED_TO_RECORD,
  NOT_RESIDENTS,
} from "./violation-messages";
import { readResidentDorms } from "./violation-residents";

/** What "Simpan dan jadwalkan publikasi" tells the one who saved. */
export interface SavedViolations {
  /** How many violations it kept. */
  count: number;
  announcedAt: Date;
}

type StoredViolation = typeof dormViolations.$inferSelect;

/**
 * Holds the key of a list until the transaction ends. Its rows share the
 * key, which no rule of the table keeps once: without this, a list sent
 * twice at the same moment would find no row of the other and be kept
 * twice.
 */
async function lockListKey(tx: Database, key: string): Promise<void> {
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`,
  );
}

function rowKey(row: ViolationRowInput): string {
  return JSON.stringify([
    row.studentId,
    row.reason,
    row.punishment,
    row.otherPunishment,
  ]);
}

/**
 * Whether a kept row and the list sent again ask for the same hour. An
 * hour that had passed is kept as the moment of its save, so any hour
 * sent again that had also passed by then counts as the same. The hour as
 * sent is compared, not the moment it becomes: a second press landing
 * just after the hour would otherwise announce at its own moment.
 */
function isSameAnnouncement(
  kept: StoredViolation,
  input: ViolationsInput,
): boolean {
  const requested = input.requestedAt.getTime();
  if (requested === kept.announcedAt.getTime()) return true;
  const keptHadPassed = kept.announcedAt.getTime() === kept.enteredAt.getTime();
  return keptHadPassed && requested <= kept.enteredAt.getTime();
}

/**
 * Whether the rows kept under a key are the list this form saved before:
 * by the same account, with the same day, the same announcement hour and
 * every row the same. A list changed after it was sent is not the same:
 * taking it for one would drop the change while saying it was saved.
 */
function isSameList(
  kept: StoredViolation[],
  actorId: string,
  input: ViolationsInput,
): boolean {
  const isOwn = kept.every(
    (row) =>
      row.enteredBy === actorId &&
      row.day === input.day &&
      isSameAnnouncement(row, input),
  );
  if (!isOwn || kept.length !== input.rows.length) return false;
  const keptRows = kept.map(rowKey).sort();
  const sentRows = input.rows.map(rowKey).sort();
  return keptRows.join() === sentRows.join();
}

function answerOf(rows: { announcedAt: Date }[]): Parsed<SavedViolations> {
  const announcedAt = rows[0]?.announcedAt ?? new Date(0);
  return { ok: true, value: { count: rows.length, announcedAt } };
}

async function keptUnder(tx: Database, key: string) {
  return tx
    .select()
    .from(dormViolations)
    .where(eq(dormViolations.batchId, key))
    .orderBy(asc(dormViolations.enteredAt));
}

async function save(
  tx: Database,
  actor: AccountForAccess,
  key: string,
  input: ViolationsInput,
  moment: Date,
): Promise<Parsed<SavedViolations>> {
  // A second press waits here for the first to end, then adds nothing.
  await lockListKey(tx, key);
  const kept = await keptUnder(tx, key);
  if (kept.length > 0) {
    return isSameList(kept, actor.id, input)
      ? answerOf(kept)
      : LIST_ALREADY_SENT;
  }
  const dorms = await readResidentDorms(
    tx,
    input.rows.map((row) => row.studentId),
    campusDay(moment),
  );
  const values = [];
  for (const row of input.rows) {
    const dorm = dorms.get(row.studentId);
    if (dorm === undefined) return NOT_RESIDENTS;
    values.push({
      ...row,
      batchId: key,
      dorm,
      day: input.day,
      announcedAt: input.announcedAt,
      enteredBy: actor.id,
      enteredAt: moment,
    });
  }
  const added = await tx
    .insert(dormViolations)
    .values(values)
    .returning({ id: dormViolations.id });
  await tx.insert(dormViolationChanges).values(
    added.map(({ id }) => ({
      violationId: id,
      changedBy: actor.id,
      changedAt: WRITTEN_NOW,
      action: "entered" as const,
    })),
  );
  return answerOf(values);
}

/**
 * "Simpan dan jadwalkan publikasi": keeps the list of violations, each
 * for a resident of a dorm today, in the dorm they live in, as the work
 * of the actor, with a line in the log for each. Refused, with nothing
 * kept, for a role without the right, for what the form rules refuse,
 * and for a student who does not live in a dorm. `key` is the key its
 * form made: a list sent twice is kept once, and the second press is
 * answered as the first.
 */
export async function saveViolations(
  db: Database,
  actor: AccountForAccess,
  key: string,
  sent: SentViolations,
  moment: Date = new Date(),
): Promise<Parsed<SavedViolations>> {
  if (!may(actor.roles, "record_dorm_violations")) return NOT_ALLOWED_TO_RECORD;
  const parsed = parseViolations(sent, moment, actor.studentId);
  if (!parsed.ok) return parsed;
  if (!isUuid(key)) return LIST_ALREADY_SENT;
  const input = parsed.value;
  return db.transaction((tx) => save(tx, actor, key, input, moment));
}
