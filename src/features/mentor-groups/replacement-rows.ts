import { desc, eq } from "drizzle-orm";
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
import type { GroupCodeParts } from "@/ui/group-code";
import { MEMBERS } from "./group-list";
import {
  type ReplacementStatus,
  replacementStatus,
} from "./replacement-status";
import { groupsVisibleTo } from "./visible-groups";

/** How many replacements "Riwayat penggantian" shows. */
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

function readRows(db: Database, limit: RowLimit) {
  return db
    .select(ROW)
    .from(mentorReplacements)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorReplacements.groupId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .innerJoin(accounts, eq(accounts.id, mentorReplacements.oldMentorId))
    .innerJoin(newMentor, eq(newMentor.id, mentorReplacements.newMentorId))
    .leftJoin(canceller, eq(canceller.id, mentorReplacements.cancelledBy))
    .where(groupsVisibleTo(limit))
    .orderBy(
      desc(mentorReplacements.startsOn),
      desc(mentorReplacements.setAt),
      desc(mentorReplacements.id),
    )
    .limit(LISTED_REPLACEMENTS);
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
 * "Riwayat penggantian": the 20 replacements with the latest start date
 * that an account with this limit may see, and among those of one day
 * the one set last first. A replacement is seen through its group: one of
 * a group outside the limit, or of an ended group, is left out.
 */
export async function listReplacements(
  db: Database,
  limit: RowLimit,
): Promise<ListedReplacement[]> {
  const rows = await readRows(db, limit);
  return rows.map(listed);
}
