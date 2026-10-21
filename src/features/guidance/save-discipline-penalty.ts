import { eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import { type AccountForAccess, may } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { disciplinePenalties, disciplinePenaltyChanges } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import type { PenaltyStatus } from "./penalty-ids";
import {
  type PenaltyInput,
  parsePenalty,
  type SentPenalty,
} from "./penalty-input";
import {
  NOT_ALLOWED_TO_RECORD,
  NOT_RECORDABLE,
  PENALTY_ALREADY_SENT,
  PLACE_NEEDS_AGENCY,
} from "./penalty-messages";
import { readPenaltyPick } from "./penalty-student";

/** What "Simpan pelanggaran" tells the one who saved. */
export interface SavedPenalty {
  name: string;
  status: PenaltyStatus;
}

type StoredPenalty = typeof disciplinePenalties.$inferSelect;

function sameForms(kept: readonly string[], sent: readonly string[]): boolean {
  return (
    kept.length === sent.length && kept.every((form, at) => form === sent[at])
  );
}

/**
 * Whether the penalty kept under a key is the one this form added
 * before: by the same account, with every part the same. A form changed
 * after it was sent is not the same form: taking it for one would drop
 * the change while saying it was saved.
 */
function isSamePenalty(
  kept: StoredPenalty,
  actorId: string,
  input: PenaltyInput,
): boolean {
  return (
    kept.savedBy === actorId &&
    kept.studentId === input.studentId &&
    kept.day === input.day &&
    kept.description === input.description &&
    kept.category === input.category &&
    kept.level === input.level &&
    kept.status === input.status &&
    kept.decisionNumber === input.decisionNumber &&
    sameForms(kept.socialWorkForms, input.socialWorkForms) &&
    kept.socialWorkOther === input.socialWorkOther &&
    kept.socialWorkPlace === input.socialWorkPlace &&
    kept.socialWorkStartsOn === input.socialWorkStartsOn &&
    kept.socialWorkEndsOn === input.socialWorkEndsOn
  );
}

/** Adds the penalty with its log line, or finds it kept already. Whether it is this form's. */
async function keep(
  tx: Database,
  actorId: string,
  id: string,
  input: PenaltyInput,
  moment: Date,
): Promise<boolean> {
  // A second press waits here for the first to end, then adds nothing.
  const added = await tx
    .insert(disciplinePenalties)
    .values({ ...input, id, savedBy: actorId, savedAt: moment })
    .onConflictDoNothing({ target: disciplinePenalties.id })
    .returning({ id: disciplinePenalties.id });
  if (added.length === 0) {
    const [kept] = await tx
      .select()
      .from(disciplinePenalties)
      .where(eq(disciplinePenalties.id, id));
    return kept !== undefined && isSamePenalty(kept, actorId, input);
  }
  await tx.insert(disciplinePenaltyChanges).values({
    penaltyId: id,
    changedBy: actorId,
    changedAt: WRITTEN_NOW,
    action: "added",
  });
  return true;
}

async function save(
  tx: Database,
  actor: AccountForAccess,
  id: string,
  input: PenaltyInput,
  moment: Date,
): Promise<Parsed<SavedPenalty>> {
  const student = await readPenaltyPick(tx, actor, input.studentId);
  if (student === null) return NOT_RECORDABLE;
  if (input.socialWorkPlace === "home_agency" && !student.hasAgency) {
    return PLACE_NEEDS_AGENCY;
  }
  if (!(await keep(tx, actor.id, id, input, moment))) {
    return PENALTY_ALREADY_SENT;
  }
  return { ok: true, value: { name: student.name, status: input.status } };
}

/**
 * "Simpan pelanggaran": keeps a discipline penalty of an Aktif student as
 * the work of the actor, with a line in the log. Refused, with nothing
 * kept, for a role without the right, for what the form rules refuse,
 * for a student the actor may not record for, and for kerja sosial at
 * an Instansi asal the student does not have. `id` is the key its form
 * made: a form sent twice is kept once, and the second press is answered
 * as the first.
 */
export async function saveDisciplinePenalty(
  db: Database,
  actor: AccountForAccess,
  id: string,
  sent: SentPenalty,
  moment: Date = new Date(),
): Promise<Parsed<SavedPenalty>> {
  if (!may(actor.roles, "record_discipline_penalties")) {
    return NOT_ALLOWED_TO_RECORD;
  }
  const periods = await readAcademicPeriods(db);
  const parsed = parsePenalty(sent, campusDay(moment), periods);
  if (!parsed.ok) return parsed;
  if (!isUuid(id)) return PENALTY_ALREADY_SENT;
  const input = parsed.value;
  return db.transaction((tx) => save(tx, actor, id, input, moment));
}
