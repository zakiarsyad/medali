import { and, eq } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { students } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { type OwnEntry, readSikuOf } from "./own-siku";
import type { SikuReason } from "./siku-ids";
import type { SikuTotals } from "./siku-score";

/** The loss whose reason and note belong to the student's discipline record. */
const DISCIPLINE_REASON: SikuReason = "discipline_penalty";

/** A line shown without its reason, its note and its basis. */
export interface WithheldEntry
  extends Pick<
    OwnEntry,
    "id" | "day" | "kind" | "points" | "enteredAs" | "fromFile"
  > {
  reason: null;
}

/** A gain or loss of a student as one account may see it. */
export type SikuLine = OwnEntry | WithheldEntry;

export interface StudentSiku {
  totals: SikuTotals;
  /** The entries in force, the latest day first. */
  entries: SikuLine[];
}

export type StudentSikuAnswer =
  | { kind: "refused" }
  | { kind: "shown"; siku: StudentSiku };

const REFUSED = { kind: "refused" } as const;

function withheld(entry: OwnEntry): WithheldEntry {
  const { id, day, kind, points, enteredAs, fromFile } = entry;
  return { id, day, kind, points, enteredAs, fromFile, reason: null };
}

/**
 * The lines an account may read: a discipline loss loses its reason and
 * note for an account that may not read discipline records.
 */
export function linesFor(
  roles: AccountForAccess["roles"],
  entries: readonly OwnEntry[],
): SikuLine[] {
  if (may(roles, "view_discipline_records")) return [...entries];
  return entries.map((entry) =>
    entry.reason === DISCIPLINE_REASON ? withheld(entry) : entry,
  );
}

async function isShownOnTab(
  db: Database,
  account: AccountForAccess,
  studentId: string,
): Promise<boolean> {
  const visible = visibleTo(rowLimitForAction(account, "view_siku"));
  const [found] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, studentId), visible, ACTIVE_MEMBER));
  return found !== undefined;
}

/**
 * The SIKU of one student, for their detail. Refused for an account
 * without Penilaian SIKU, and for a student that tab does not show it:
 * one outside its rows, and one who is not Aktif.
 */
export async function readStudentSiku(
  db: Database,
  account: AccountForAccess,
  studentId: string,
): Promise<StudentSikuAnswer> {
  if (!may(account.roles, "view_siku")) return REFUSED;
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(studentId)) return REFUSED;
  if (!(await isShownOnTab(db, account, studentId))) return REFUSED;
  const { totals, entries } = await readSikuOf(db, studentId);
  return {
    kind: "shown",
    siku: { totals, entries: linesFor(account.roles, entries) },
  };
}
