import { and, eq, type SQL, sql } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { sikuAdjustments, sikuRequests, students } from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import type { Parsed } from "@/parsed";
import {
  approvedWords,
  entryNoteOf,
  parseDecision,
  REQUEST_REJECTED,
  type RequestDecision,
} from "./request-decision";
import {
  DECIDE_NOT_ALLOWED,
  DECIDED_BEFORE,
  REQUEST_GONE,
  STUDENT_NOT_ACTIVE,
} from "./request-messages";
import {
  enteredAsOf,
  nameAndLogEntry,
  newEntryRow,
  periodOfNewEntry,
} from "./save-entry";

/** A decision as the card sends it: nothing in it is trusted. */
export interface SentDecision {
  kind: unknown;
  points: unknown;
  note: unknown;
}

/**
 * The request as it is stored, of a student the decider sees, held so
 * that nobody else decides or withdraws it until this decision is saved:
 * a second at the same moment waits here, and then finds it changed.
 */
async function holdRequest(tx: Database, visible: SQL, id: string) {
  const [held] = await tx
    .select({
      status: sikuRequests.status,
      studentId: sikuRequests.studentId,
      isActive: sql<boolean>`${ACTIVE_MEMBER}`,
      name: students.name,
      reason: sikuRequests.reason,
      day: sikuRequests.day,
      report: sikuRequests.report,
    })
    .from(sikuRequests)
    .innerJoin(students, eq(students.id, sikuRequests.studentId))
    .where(and(eq(sikuRequests.id, id), visible))
    .for("update", { of: sikuRequests });
  return held;
}

type Held = NonNullable<Awaited<ReturnType<typeof holdRequest>>>;

/** Who decides, the role they decide as, and when. */
function decidedBy(actor: AccountForAccess, at: Date) {
  return {
    decidedBy: actor.id,
    decidedAs: enteredAsOf(actor.roles),
    decidedAt: at,
  };
}

/**
 * "Setujui": a gain of the chosen points for the student of the request
 * alone, made as any entry is, with its line in the log, its reason and
 * its day those of the request, and the report as its Keterangan. The
 * request keeps it.
 */
async function approve(
  tx: Database,
  actor: AccountForAccess,
  id: string,
  held: Held,
  decision: { points: number; note: string },
  at: Date,
): Promise<Parsed<string>> {
  if (!held.isActive) return STUDENT_NOT_ACTIVE;
  const studentIds = [held.studentId];
  const period = await periodOfNewEntry(tx, studentIds, at);
  if (!period.ok) return period;
  const entryId = crypto.randomUUID();
  const entry = {
    kind: "gain",
    reason: held.reason,
    points: decision.points,
    day: held.day,
    note: entryNoteOf(held.report),
    basis: "",
  } as const;
  await tx
    .insert(sikuAdjustments)
    .values(newEntryRow(actor, entryId, entry, period.value, at));
  await nameAndLogEntry(tx, actor.id, entryId, studentIds);
  await tx
    .update(sikuRequests)
    .set({
      ...decidedBy(actor, at),
      status: "approved",
      decisionNote: decision.note,
      entryId,
    })
    .where(eq(sikuRequests.id, id));
  return { ok: true, value: approvedWords(decision.points, held.name) };
}

async function reject(
  tx: Database,
  actor: AccountForAccess,
  id: string,
  note: string,
  at: Date,
): Promise<Parsed<string>> {
  await tx
    .update(sikuRequests)
    .set({ ...decidedBy(actor, at), status: "rejected", decisionNote: note })
    .where(eq(sikuRequests.id, id));
  return { ok: true, value: REQUEST_REJECTED };
}

function decide(
  db: Database,
  actor: AccountForAccess,
  id: string,
  decision: RequestDecision,
  at: Date,
): Promise<Parsed<string>> {
  const visible = visibleTo(rowLimitForAction(actor, "decide_siku_additions"));
  return db.transaction(async (tx) => {
    const held = await holdRequest(tx, visible, id);
    if (!held || held.status === "withdrawn") return REQUEST_GONE;
    if (held.status !== "waiting") return DECIDED_BEFORE;
    if (decision.kind === "reject") {
      return reject(tx, actor, id, decision.note, at);
    }
    return approve(tx, actor, id, held, decision, at);
  });
}

/**
 * "Setujui" or "Tolak" on a waiting request, for Kepala Unit and Penilai
 * Mahasiswa only; anyone else is refused before anything is read. The
 * request keeps who decided, the role they decided as and when. An
 * approval is refused, with nothing kept, while no academic period runs
 * and for a student who is not Aktif now. Only a request that still
 * waits is decided: a withdrawal or another decision saved first wins,
 * and a second press of "Setujui" adds no second gain. `id`, and what
 * was decided, come from outside and are not trusted; `at` is the moment
 * on the server's clock.
 */
export async function decideSikuRequest(
  db: Database,
  actor: AccountForAccess,
  id: string,
  sent: SentDecision,
  at: Date,
): Promise<Parsed<string>> {
  if (!may(actor.roles, "decide_siku_additions")) return DECIDE_NOT_ALLOWED;
  if (!isUuid(id)) return REQUEST_GONE;
  const decision = parseDecision(sent.kind, sent.points, sent.note);
  if (!decision.ok) return decision;
  return decide(db, actor, id, decision.value, at);
}
