import { and, count, desc, eq, isNull, type SQL, sql } from "drizzle-orm";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  accounts,
  sikuAdjustmentStudents,
  sikuAdjustments,
  sikuRequests,
  students,
  studyPrograms,
} from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { pageWithin } from "@/ui/list-pages";
import { GAIN_CANCELLED, NOT_WITHDRAWN } from "./own-requests";
import { type RequestPhoto, readRequestPhotos } from "./request-photos";
import { type ShownStatus, shownStatus } from "./request-status";
import { REQUEST_PAGE_SIZE, type RequestFilter } from "./siku-address";
import type { SikuReason } from "./siku-ids";

/** A request as a card of the staff panel shows it. */
export interface RequestCard {
  id: string;
  name: string;
  nim: string;
  program: string;
  reason: SikuReason;
  day: string;
  report: string;
  sentAt: Date;
  status: ShownStatus;
  /** The points of the gain an approval made, or null for none. */
  points: number | null;
  /** The name of the staff member who decided it, for staff only. */
  decidedBy: string | null;
  decidedAs: RoleId | null;
  decidedAt: Date | null;
  note: string;
  /**
   * Whether the student has a gain in force with the same reason on the
   * same day, other than the one this request made.
   */
  hasSameGain: boolean;
  photos: RequestPhoto[];
}

export interface RequestBoard {
  /** How many requests each choice holds, of the students the account sees. */
  counts: Record<RequestFilter, number>;
  cards: RequestCard[];
  /** How many requests the choice holds, on every page. */
  matching: number;
  page: number;
}

const WHICH_REQUESTS: Record<RequestFilter, SQL | undefined> = {
  waiting: eq(sikuRequests.status, "waiting"),
  approved: and(
    eq(sikuRequests.status, "approved"),
    isNull(sikuAdjustments.cancelledAt),
  ),
  rejected: eq(sikuRequests.status, "rejected"),
  all: undefined,
};

/** A request of an Aktif student the account sees, that was not withdrawn. */
function seenRequests(visible: SQL): SQL | undefined {
  return and(NOT_WITHDRAWN, visible, ACTIVE_MEMBER);
}

const HAS_SAME_GAIN = sql<boolean>`exists (
  select 1 from ${sikuAdjustmentStudents} same_student
  inner join ${sikuAdjustments} same_gain
    on same_gain.id = same_student.adjustment_id
  where same_student.student_id = ${sikuRequests.studentId}
    and same_gain.kind = 'gain'
    and same_gain.reason = ${sikuRequests.reason}
    and same_gain.day = ${sikuRequests.day}
    and same_gain.cancelled_at is null
    and same_gain.id is distinct from ${sikuRequests.entryId}
)`;

function baseOf(db: Database) {
  return db
    .select({
      id: sikuRequests.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
      reason: sikuRequests.reason,
      day: sikuRequests.day,
      report: sikuRequests.report,
      sentAt: sikuRequests.sentAt,
      status: sikuRequests.status,
      gainCancelled: GAIN_CANCELLED,
      points: sikuAdjustments.points,
      decidedBy: accounts.name,
      decidedAs: sikuRequests.decidedAs,
      decidedAt: sikuRequests.decidedAt,
      note: sikuRequests.decisionNote,
      hasSameGain: HAS_SAME_GAIN,
    })
    .from(sikuRequests)
    .innerJoin(students, eq(students.id, sikuRequests.studentId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .leftJoin(sikuAdjustments, eq(sikuAdjustments.id, sikuRequests.entryId))
    .leftJoin(accounts, eq(accounts.id, sikuRequests.decidedBy));
}

async function readCounts(
  db: Database,
  visible: SQL,
): Promise<Record<RequestFilter, number>> {
  const rows = await db
    .select({
      status: sikuRequests.status,
      gainCancelled: GAIN_CANCELLED,
      requests: count(),
    })
    .from(sikuRequests)
    .innerJoin(students, eq(students.id, sikuRequests.studentId))
    .leftJoin(sikuAdjustments, eq(sikuAdjustments.id, sikuRequests.entryId))
    .where(seenRequests(visible))
    .groupBy(sikuRequests.status, GAIN_CANCELLED);
  const counts = { waiting: 0, approved: 0, rejected: 0, all: 0 };
  for (const { status, gainCancelled, requests } of rows) {
    const shown = shownStatus({ status, gainCancelled });
    if (shown === null) continue;
    counts.all += requests;
    if (shown !== "cancelled") counts[shown] += requests;
  }
  return counts;
}

/**
 * "Pengajuan penambahan SIKU dari mahasiswa": how many requests each
 * choice holds, and one page of the cards of the chosen one, the newest
 * first, 12 a page, of the Aktif students `visible` holds, as the tab
 * counts only those. A withdrawn request is shown to nobody. A request
 * whose gain was cancelled is among Semua only.
 */
export async function readRequestBoard(
  db: Database,
  visible: SQL,
  filter: RequestFilter,
  page: number,
): Promise<RequestBoard> {
  const counts = await readCounts(db, visible);
  const matching = counts[filter];
  const shownPage = pageWithin(page, matching, REQUEST_PAGE_SIZE);
  const rows = await baseOf(db)
    .where(and(seenRequests(visible), WHICH_REQUESTS[filter]))
    .orderBy(desc(sikuRequests.sentAt), desc(sikuRequests.id))
    .limit(REQUEST_PAGE_SIZE)
    .offset((shownPage - 1) * REQUEST_PAGE_SIZE);
  const photos = await readRequestPhotos(
    db,
    rows.map((row) => row.id),
  );
  const cards = rows.flatMap(({ status, gainCancelled, ...row }) => {
    const shown = shownStatus({ status, gainCancelled });
    if (shown === null) return [];
    return [{ ...row, status: shown, photos: photos.get(row.id) ?? [] }];
  });
  return { counts, cards, matching, page: shownPage };
}
