import { and, desc, eq, isNotNull, or, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  accounts,
  mentorGroups,
  mentorReplacements,
  studyPrograms,
} from "@/db/schema";
import type {
  OldMentorStatus,
  ReplacementReason,
} from "@/mentoring/replacement-ids";
import { IS_WAITING } from "@/mentoring/waiting-replacement";
import type { GroupCodeParts } from "@/ui/group-code";
import { MEMBERS } from "./group-list";
import {
  type ReplacementStatus,
  replacementStatus,
} from "./replacement-status";
import { groupsVisibleTo } from "./visible-groups";

/** How many replacements "Riwayat penggantian" shows, unless more wait. */
export const LISTED_REPLACEMENTS = 20;

/** One replacement as "Riwayat penggantian" shows it. The NIP of nobody is read. */
export interface ListedReplacement {
  id: string;
  /** "Tanggal efektif". */
  startsOn: string;
  group: GroupCodeParts & { id: string; studyProgramId: number };
  /** How many Aktif students the group holds today. */
  members: number;
  oldMentorName: string;
  oldMentorStatus: OldMentorStatus;
  newMentorName: string;
  reason: ReplacementReason;
  /** "Keterangan". */
  note: string | null;
  letterNumber: string;
  status: ReplacementStatus;
  /** Who cancelled it and when. Null for one that is not cancelled. */
  cancelled: { by: string; at: Date } | null;
}

const newMentor = alias(accounts, "new_mentor");
const canceller = alias(accounts, "canceller");

const ROW = {
  id: mentorReplacements.id,
  startsOn: mentorReplacements.startsOn,
  group: {
    id: mentorGroups.id,
    studyProgramId: mentorGroups.studyProgramId,
    cohortYear: mentorGroups.cohortYear,
    entryPath: mentorGroups.entryPath,
    number: mentorGroups.number,
    programCode: studyPrograms.code,
  },
  members: MEMBERS,
  oldMentorName: accounts.name,
  oldMentorStatus: mentorReplacements.oldMentorStatus,
  newMentorName: newMentor.name,
  reason: mentorReplacements.reason,
  note: mentorReplacements.note,
  letterNumber: mentorReplacements.letterNumber,
  carriedOutAt: mentorReplacements.carriedOutAt,
  cancelledAt: mentorReplacements.cancelledAt,
  cancellerName: canceller.name,
};

/** A replacement that waits no more: Berlaku or Dibatalkan. */
const WAITS_NO_MORE = or(
  isNotNull(mentorReplacements.carriedOutAt),
  isNotNull(mentorReplacements.cancelledAt),
);

/** The replacements of one kind that the limit lets through, the latest first. */
function readRows(db: Database, limit: RowLimit, kind: SQL | undefined) {
  return db
    .select(ROW)
    .from(mentorReplacements)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorReplacements.groupId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .innerJoin(accounts, eq(accounts.id, mentorReplacements.oldMentorId))
    .innerJoin(newMentor, eq(newMentor.id, mentorReplacements.newMentorId))
    .leftJoin(canceller, eq(canceller.id, mentorReplacements.cancelledBy))
    .where(and(groupsVisibleTo(limit), kind))
    .orderBy(
      desc(mentorReplacements.startsOn),
      desc(mentorReplacements.setAt),
      desc(mentorReplacements.id),
    );
}

type ReadRow = Awaited<ReturnType<typeof readRows>>[number];

function listed(row: ReadRow): ListedReplacement {
  const { carriedOutAt, cancelledAt, cancellerName, ...replacement } = row;
  const isCancelled = cancelledAt !== null && cancellerName !== null;
  return {
    ...replacement,
    status: replacementStatus({ carriedOutAt, cancelledAt }),
    cancelled: isCancelled ? { by: cancellerName, at: cancelledAt } : null,
  };
}

/**
 * "Riwayat penggantian": first every replacement that waits for its start
 * date, because "Batalkan" stands on its row only and one that is not
 * listed could never be cancelled. Then the others with the latest start
 * date, as many as make 20 rows with the waiting ones, and none when 20
 * or more wait. Within each kind the latest start date comes first, and
 * among those of one day the one set last. A replacement is seen through
 * its group: one of a group outside the limit, or of an ended group, is
 * left out.
 */
export async function listReplacements(
  db: Database,
  limit: RowLimit,
): Promise<ListedReplacement[]> {
  const waiting = await readRows(db, limit, IS_WAITING);
  const others = await readRows(db, limit, WAITS_NO_MORE).limit(
    LISTED_REPLACEMENTS,
  );
  return waitingThenOthers(waiting, others).map(listed);
}

/**
 * The two reads do not see the same moment. The waiting ones are read
 * first, so a replacement that is carried out or cancelled between the
 * reads comes back in both and never in neither. It is listed once, as it
 * was while it waited.
 */
export function waitingThenOthers<Row extends { id: unknown }>(
  waiting: Row[],
  others: Row[],
): Row[] {
  const waitingIds = new Set(waiting.map((row) => row.id));
  const room = Math.max(0, LISTED_REPLACEMENTS - waiting.length);
  const othersOnce = others.filter((row) => !waitingIds.has(row.id));
  return [...waiting, ...othersOnce.slice(0, room)];
}
