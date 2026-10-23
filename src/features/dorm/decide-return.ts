import { and, eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormLeaves, dormReturnReports } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import type { Parsed } from "@/parsed";
import { lettersIn } from "@/ui/letters-in";
import { NOTE_TOO_LONG } from "./decide-leave";
import { DECISION_NOTE_MAX_LENGTH } from "./leave-ids";
import { type Decided, REJECTION_NEEDS_NOTE } from "./leave-messages";
import { isOwnRecord, OWN_RECORD } from "./own-record";
import {
  type DecidedStatus,
  NO_VALIDATE_DECISION,
  NO_VERIFY_DECISION,
  REPORT_NOT_FOUND,
  reportDecidedFirst,
  STILL_WAITS_FOR_BAM,
  VALIDATE_NOT_ALLOWED,
  VERIFY_NOT_ALLOWED,
} from "./return-messages";
import { lockLeave } from "./return-store";

type Decider = Pick<Account, "id" | "roles" | "studentId">;

/** What "Verifikasi" and "Tolak" of BAM - BPHK make a report. */
const VERIFY_DECISIONS: Record<string, DecidedStatus> = {
  verify: "verified",
  reject: "rejected",
};

/** What "Validasi kembali" and "Tolak" of Pengelola Asrama make a report. */
const VALIDATE_DECISIONS: Record<string, DecidedStatus> = {
  validate: "validated",
  reject: "rejected",
};

interface Decision {
  status: DecidedStatus;
  note: string;
}

/**
 * The status a decision gives with its note, checked: `none` answers a
 * decision that is not one of `decisions`.
 */
function parsedDecision(
  decisions: Record<string, DecidedStatus>,
  decision: string,
  note: string,
  none: { ok: false; error: string },
): Parsed<Decision> {
  const status = Object.hasOwn(decisions, decision)
    ? decisions[decision]
    : undefined;
  if (status === undefined) return none;
  const trimmed = note.trim();
  if (lettersIn(trimmed) > DECISION_NOTE_MAX_LENGTH) return NOTE_TOO_LONG;
  if (status === "rejected" && trimmed === "") return REJECTION_NEEDS_NOTE;
  return { ok: true, value: { status, note: trimmed } };
}

/** Where a report stands now, or undefined when there is none. */
async function statusOf(db: Database, reportId: string) {
  const [kept] = await db
    .select({
      status: dormReturnReports.status,
      leaveId: dormReturnReports.leaveId,
    })
    .from(dormReturnReports)
    .where(eq(dormReturnReports.id, reportId));
  return kept;
}

/** The student whose leave a report is of, or undefined when there is none. */
async function studentOfReport(
  db: Database,
  reportId: string,
): Promise<string | undefined> {
  const [kept] = await db
    .select({ studentId: dormLeaves.studentId })
    .from(dormReturnReports)
    .innerJoin(dormLeaves, eq(dormLeaves.id, dormReturnReports.leaveId))
    .where(eq(dormReturnReports.id, reportId));
  return kept?.studentId;
}

/**
 * "Verifikasi" and "Tolak" of BAM - BPHK: a report that waits for BAM
 * moves on to Pengelola Asrama, or is rejected with a note, which the
 * resident sees before sending a new photo. Who decided, when, and the
 * note are kept. Refused for a role that may not verify, Kepala Unit and
 * Pengelola Asrama among them, for the account's own report, and for a
 * report that no longer waits for
 * BAM: the database changes it only while it waits, so of two decisions
 * at once the second waits for the first, then is refused.
 */
export async function verifyReturn(
  db: Database,
  actor: Decider,
  reportId: string,
  decision: string,
  note: string,
): Promise<Decided<DecidedStatus>> {
  if (!may(actor.roles, "verify_dorm_return")) return VERIFY_NOT_ALLOWED;
  if (!isUuid(reportId)) return REPORT_NOT_FOUND;
  const sent = parsedDecision(
    VERIFY_DECISIONS,
    decision,
    note,
    NO_VERIFY_DECISION,
  );
  if (!sent.ok) return sent;
  const studentId = await studentOfReport(db, reportId);
  if (studentId === undefined) return REPORT_NOT_FOUND;
  if (isOwnRecord(actor.studentId, studentId)) return OWN_RECORD;
  const { status } = sent.value;
  const decided = await db
    .update(dormReturnReports)
    .set({
      status,
      verifiedBy: actor.id,
      verifiedAt: WRITTEN_NOW,
      verifyNote: sent.value.note,
    })
    .where(
      and(
        eq(dormReturnReports.id, reportId),
        eq(dormReturnReports.status, "waiting"),
      ),
    )
    .returning({ id: dormReturnReports.id });
  if (decided.length > 0) return { ok: true, value: status };
  const kept = await statusOf(db, reportId);
  if (!kept || kept.status === "waiting") return REPORT_NOT_FOUND;
  return reportDecidedFirst(kept.status);
}

/** Makes the leave of a validated report Selesai, back at the time of the report. */
async function completeLeave(
  tx: Database,
  leaveId: string,
  returnedAt: Date,
): Promise<void> {
  await tx
    .update(dormLeaves)
    .set({ status: "completed", returnedAt })
    .where(and(eq(dormLeaves.id, leaveId), eq(dormLeaves.status, "approved")));
}

async function validate(
  tx: Database,
  actor: Decider,
  reportId: string,
  decision: Decision,
): Promise<Decided<DecidedStatus>> {
  const before = await statusOf(tx, reportId);
  if (!before) return REPORT_NOT_FOUND;
  // Held first, so a return recorded at the same moment is never saved beside this one.
  await lockLeave(tx, before.leaveId);
  const decided = await tx
    .update(dormReturnReports)
    .set({
      status: decision.status,
      validatedBy: actor.id,
      validatedAt: WRITTEN_NOW,
      validateNote: decision.note,
    })
    .where(
      and(
        eq(dormReturnReports.id, reportId),
        eq(dormReturnReports.status, "verified"),
      ),
    )
    .returning({ sentAt: dormReturnReports.sentAt });
  const [report] = decided;
  if (report === undefined) {
    const kept = await statusOf(tx, reportId);
    if (!kept) return REPORT_NOT_FOUND;
    if (kept.status === "waiting") return STILL_WAITS_FOR_BAM;
    return reportDecidedFirst(kept.status);
  }
  if (decision.status === "validated") {
    await completeLeave(tx, before.leaveId, report.sentAt);
  }
  return { ok: true, value: decision.status };
}

/**
 * "Validasi kembali" and "Tolak" of Pengelola Asrama, on a report that
 * BAM - BPHK verified. A validation makes the leave Selesai, with the
 * time of the report as the actual return, so dorm activities up to
 * then count as Izin. A rejection needs a note, which the resident sees
 * before sending a new photo. A report that still waits for BAM says so.
 * Refused for a role that may not validate, BAM - BPHK among them. The
 * database changes the report only while BAM's verification is its
 * last decision, so of two decisions at once the second waits for the
 * first, then is refused.
 */
export async function validateReturn(
  db: Database,
  actor: Decider,
  reportId: string,
  decision: string,
  note: string,
): Promise<Decided<DecidedStatus>> {
  if (!may(actor.roles, "validate_dorm_return")) return VALIDATE_NOT_ALLOWED;
  if (!isUuid(reportId)) return REPORT_NOT_FOUND;
  const sent = parsedDecision(
    VALIDATE_DECISIONS,
    decision,
    note,
    NO_VALIDATE_DECISION,
  );
  if (!sent.ok) return sent;
  const decided = sent.value;
  return db.transaction((tx) => validate(tx, actor, reportId, decided));
}
