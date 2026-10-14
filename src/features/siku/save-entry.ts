import { and, eq, inArray } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { type AccountForAccess, may } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  sikuAdjustmentChanges,
  sikuAdjustmentStudents,
  sikuAdjustments,
  students,
} from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import type { Parsed } from "@/parsed";
import { type EntryInput, parseEntry, type SentEntry } from "./entry-input";
import type { SikuKind } from "./siku-ids";
import {
  ENTRY_ALREADY_SENT,
  NO_PERIOD,
  NOT_ACTIVE_STUDENTS,
  NOT_ALLOWED_TO_ADJUST,
} from "./siku-messages";

/** What "Simpan" tells the one who saved. */
export interface SavedEntry {
  kind: SikuKind;
  points: number;
  /** How many students it holds. */
  students: number;
}

type StoredEntry = typeof sikuAdjustments.$inferSelect;

/**
 * The role an entry is made as, which a student is shown in its place:
 * Penilai Mahasiswa when the account holds it, as the role that enters
 * SIKU day to day, or else Kepala Unit.
 */
export function enteredAsOf(roles: readonly RoleId[]): RoleId {
  return roles.includes("assessor") ? "assessor" : "head_of_unit";
}

async function countActive(tx: Database, ids: string[]): Promise<number> {
  const found = await tx
    .select({ id: students.id })
    .from(students)
    .where(and(inArray(students.id, ids), ACTIVE_MEMBER));
  return found.length;
}

async function studentsOf(tx: Database, id: string): Promise<string[]> {
  const rows = await tx
    .select({ studentId: sikuAdjustmentStudents.studentId })
    .from(sikuAdjustmentStudents)
    .where(eq(sikuAdjustmentStudents.adjustmentId, id));
  return rows.map((row) => row.studentId).sort();
}

/**
 * Whether the entry kept under a key is the one this form added before:
 * by the same account, with every part the same. A form whose parts were
 * changed after it was sent is not the same form: taking it for one
 * would drop the change while saying it was saved.
 */
async function isSameEntry(
  tx: Database,
  kept: StoredEntry,
  actorId: string,
  input: EntryInput,
): Promise<boolean> {
  const isSame =
    kept.enteredBy === actorId &&
    kept.kind === input.kind &&
    kept.reason === input.reason &&
    kept.points === input.points &&
    kept.day === input.day &&
    kept.note === input.note &&
    kept.basis === input.basis;
  if (!isSame) return false;
  const named = await studentsOf(tx, kept.id);
  return named.join() === [...input.studentIds].sort().join();
}

async function save(
  tx: Database,
  actor: AccountForAccess,
  id: string,
  input: EntryInput,
  moment: Date,
): Promise<Parsed<SavedEntry>> {
  const saved = {
    ok: true,
    value: {
      kind: input.kind,
      points: input.points,
      students: input.studentIds.length,
    },
  } as const;
  const period = await readRunningPeriod(tx, campusDay(moment));
  if (period === null) return NO_PERIOD;
  const active = await countActive(tx, input.studentIds);
  if (active !== input.studentIds.length) return NOT_ACTIVE_STUDENTS;
  const { studentIds, ...entry } = input;
  // A second press waits here for the first to end, then adds nothing.
  const added = await tx
    .insert(sikuAdjustments)
    .values({
      ...entry,
      id,
      periodId: period.id,
      enteredBy: actor.id,
      enteredAs: enteredAsOf(actor.roles),
      enteredAt: moment,
    })
    .onConflictDoNothing({ target: sikuAdjustments.id })
    .returning({ id: sikuAdjustments.id });
  if (added.length === 0) {
    const [kept] = await tx
      .select()
      .from(sikuAdjustments)
      .where(eq(sikuAdjustments.id, id));
    if (!kept) return ENTRY_ALREADY_SENT;
    const isSame = await isSameEntry(tx, kept, actor.id, input);
    return isSame ? saved : ENTRY_ALREADY_SENT;
  }
  await tx
    .insert(sikuAdjustmentStudents)
    .values(studentIds.map((studentId) => ({ adjustmentId: id, studentId })));
  await tx
    .insert(sikuAdjustmentChanges)
    .values({ adjustmentId: id, changedBy: actor.id, action: "entered" });
  return saved;
}

/**
 * "Simpan": keeps a gain or a loss of SIKU points for the chosen Aktif
 * students, in the academic period that runs on the day it is saved, as
 * the work of the actor, with a line in the log. Refused, with nothing
 * kept, for a role without the right Penilaian SIKU, for what the form
 * rules refuse, while no period runs, and for a student who is not Aktif.
 * `id` is the key its form made: a form sent twice is kept once, and
 * the second press is answered as the first.
 */
export async function saveSikuEntry(
  db: Database,
  actor: AccountForAccess,
  id: string,
  sent: SentEntry,
  moment: Date = new Date(),
): Promise<Parsed<SavedEntry>> {
  if (!may(actor.roles, "adjust_siku")) return NOT_ALLOWED_TO_ADJUST;
  const parsed = parseEntry(sent, campusDay(moment));
  if (!parsed.ok) return parsed;
  if (!isUuid(id)) return ENTRY_ALREADY_SENT;
  const input = parsed.value;
  return db.transaction((tx) => save(tx, actor, id, input, moment));
}
