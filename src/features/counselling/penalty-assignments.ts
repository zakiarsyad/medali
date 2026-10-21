import { and, eq, inArray } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  accounts,
  counsellingScheduleChanges,
  counsellingSchedules,
  disciplinePenalties,
  students,
} from "@/db/schema";
import { assignmentBasis } from "@/discipline-penalties/assignment-basis";
import { showsCallTime } from "./assessment-call-rules";
import { senderMessageOf } from "./penalty-assignment-rules";
import {
  ASSIGN_NOT_ALLOWED_WORDS,
  assignedTo,
  MESSAGE_TOO_LONG,
  PENALTY_NOT_FOUND,
} from "./penalty-assignment-words";
import {
  ASSIGNMENT_TEXT_MAX,
  type CounsellingHour,
  type ScheduleStatus,
} from "./schedule-ids";

const RIGHT = "assign_counselling_from_penalty";

/** What "Tugaskan konseling" gives back: nothing is saved on a refusal. */
export type AssignOutcome =
  | { kind: "kept"; done: string }
  | { kind: "refused"; error: string };

const NOT_ALLOWED: AssignOutcome = {
  kind: "refused",
  error: ASSIGN_NOT_ALLOWED_WORDS,
};

const NOT_FOUND: AssignOutcome = { kind: "refused", error: PENALTY_NOT_FOUND };

/** The penalties of the students the account may send for. */
function penaltiesOfRows(actor: AccountForAccess) {
  return visibleTo(rowLimitForAction(actor, RIGHT));
}

interface SentPenalty {
  id: string;
  studentId: string;
  name: string;
  basis: string;
}

/** The penalty, with its student, when it is of a student the account may send for. */
async function readPenalty(
  tx: Database,
  actor: AccountForAccess,
  penaltyId: string,
): Promise<SentPenalty | null> {
  const [found] = await tx
    .select({
      id: disciplinePenalties.id,
      studentId: disciplinePenalties.studentId,
      name: students.name,
      category: disciplinePenalties.category,
      level: disciplinePenalties.level,
    })
    .from(disciplinePenalties)
    .innerJoin(students, eq(students.id, disciplinePenalties.studentId))
    .where(and(eq(disciplinePenalties.id, penaltyId), penaltiesOfRows(actor)));
  if (!found) return null;
  const { category, level, ...penalty } = found;
  return { ...penalty, basis: assignmentBasis(category, level) };
}

async function addAssignment(
  tx: Database,
  actorId: string,
  penalty: SentPenalty,
  senderMessage: string | null,
  now: Date,
): Promise<void> {
  const [added] = await tx
    .insert(counsellingSchedules)
    .values({
      studentId: penalty.studentId,
      penaltyId: penalty.id,
      kind: "assigned",
      status: "awaiting",
      basis: penalty.basis,
      senderMessage,
      createdAt: now,
      changedBy: actorId,
      changedAt: now,
    })
    .returning({ id: counsellingSchedules.id });
  if (!added) throw new Error("The assignment was not added.");
  await tx.insert(counsellingScheduleChanges).values({
    scheduleId: added.id,
    changedBy: actorId,
    changedAt: now,
    step: "assign",
    statusBefore: null,
    statusAfter: "awaiting",
  });
}

/**
 * "Tugaskan konseling" of Pembina Disiplin Mahasiswa in "Rincian" of a
 * penalty: a Penugasan for Konselor, Menunggu jadwal, of the penalty's
 * own student, with the penalty's Kategori and Jenjang as its Dasar, the
 * message typed as Pesan pengirim, and its log line. Nothing names the
 * student but the penalty. Refused, saving nothing, without the right,
 * for a penalty not found among the account's rows, or a message too
 * long.
 */
export async function assignFromPenalty(
  db: Database,
  actor: AccountForAccess,
  penaltyId: string,
  message: string,
  now: Date = new Date(),
): Promise<AssignOutcome> {
  if (!may(actor.roles, RIGHT)) return NOT_ALLOWED;
  if (!isUuid(penaltyId)) return NOT_FOUND;
  const senderMessage = senderMessageOf(message);
  if (senderMessage !== null && senderMessage.length > ASSIGNMENT_TEXT_MAX) {
    return { kind: "refused", error: MESSAGE_TOO_LONG };
  }
  return db.transaction(async (tx) => {
    const penalty = await readPenalty(tx, actor, penaltyId);
    if (penalty === null) return NOT_FOUND;
    await addAssignment(tx, actor.id, penalty, senderMessage, now);
    return { kind: "kept", done: assignedTo(penalty.name) };
  });
}

/** How a Penugasan sent from a penalty stands, as its sender sees it. */
export interface PenaltyAssignment {
  status: ScheduleStatus;
  /** The date and Jam Konselor set; none before, or while another is asked. */
  day: string | null;
  hour: CounsellingHour | null;
  sentAt: Date;
  sentBy: string;
}

/**
 * The Penugasan sent from each of these penalties that has one, of the
 * students the account may send for. Null, reading nothing, for an
 * account without the right: nobody else is told whether a student was
 * sent to counselling.
 */
export async function readPenaltyAssignments(
  db: Database,
  actor: AccountForAccess,
  penaltyIds: readonly string[],
): Promise<Map<string, PenaltyAssignment> | null> {
  if (!may(actor.roles, RIGHT)) return null;
  const assignments = new Map<string, PenaltyAssignment>();
  const ids = penaltyIds.filter(isUuid);
  if (ids.length === 0) return assignments;
  const found = await db
    .select({
      penaltyId: counsellingSchedules.penaltyId,
      status: counsellingSchedules.status,
      day: counsellingSchedules.day,
      hour: counsellingSchedules.hour,
      sentAt: counsellingSchedules.createdAt,
      sentBy: accounts.name,
    })
    .from(counsellingSchedules)
    .innerJoin(students, eq(students.id, counsellingSchedules.studentId))
    .innerJoin(
      counsellingScheduleChanges,
      and(
        eq(counsellingScheduleChanges.scheduleId, counsellingSchedules.id),
        eq(counsellingScheduleChanges.step, "assign"),
      ),
    )
    .innerJoin(accounts, eq(accounts.id, counsellingScheduleChanges.changedBy))
    .where(
      and(
        inArray(counsellingSchedules.penaltyId, ids),
        penaltiesOfRows(actor),
      ),
    );
  for (const { penaltyId, status, day, hour, ...sent } of found) {
    if (penaltyId === null) continue;
    const timeShown = showsCallTime(status);
    assignments.set(penaltyId, {
      status,
      day: timeShown ? day : null,
      hour: timeShown ? hour : null,
      ...sent,
    });
  }
  return assignments;
}
