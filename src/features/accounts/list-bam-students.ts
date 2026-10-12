import { and, asc, count, eq, exists, inArray, type SQL } from "drizzle-orm";
import { rolesByAccount } from "@/auth/accounts";
import { BAM_ROLES, type BamRole, isBamRole } from "@/auth/bam-roles";
import type { Database } from "@/db/connect";
import { accountRoles, accounts, students, studyPrograms } from "@/db/schema";
import { isActiveStudent } from "./student-account";

export const BAM_PAGE_SIZE = 25;

export interface BamStudent {
  accountId: string;
  name: string;
  nim: string;
  studyProgram: string;
  roles: BamRole[];
  /** False for a student on Cuti, Non aktif or removed: the roles do not work. */
  isActive: boolean;
}

export interface BamStudentList {
  students: BamStudent[];
  total: number;
  /** The page shown: the last one when a page past the end was asked for. */
  page: number;
}

/** The accounts that hold a BAM role, working or not. */
export function holdsBamRole(db: Database): SQL {
  return exists(
    db
      .select({ accountId: accountRoles.accountId })
      .from(accountRoles)
      .where(
        and(
          eq(accountRoles.accountId, accounts.id),
          inArray(accountRoles.role, [...BAM_ROLES]),
        ),
      ),
  );
}

async function countBamStudents(db: Database): Promise<number> {
  const [counted] = await db
    .select({ total: count() })
    .from(accounts)
    .innerJoin(students, eq(students.id, accounts.studentId))
    .where(holdsBamRole(db));
  return counted?.total ?? 0;
}

function lastPage(total: number): number {
  return Math.max(0, Math.ceil(total / BAM_PAGE_SIZE) - 1);
}

/**
 * The students who hold a BAM role, one page at a time, by name. A
 * student who is no longer Aktif, or was removed, stays listed until the
 * roles are taken away, so the roles saved are read, not the working ones.
 */
export async function listBamStudents(
  db: Database,
  wantedPage: number,
): Promise<BamStudentList> {
  const total = await countBamStudents(db);
  const page = Math.min(wantedPage, lastPage(total));
  if (total === 0) return { students: [], total, page };
  const rows = await db
    .select({
      accountId: accounts.id,
      name: students.name,
      nim: students.nim,
      studyProgram: studyPrograms.name,
      status: students.status,
      accountRemovedAt: accounts.deletedAt,
      studentRemovedAt: students.deletedAt,
    })
    .from(accounts)
    .innerJoin(students, eq(students.id, accounts.studentId))
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .where(holdsBamRole(db))
    .orderBy(asc(students.name), asc(students.nim))
    .limit(BAM_PAGE_SIZE)
    .offset(page * BAM_PAGE_SIZE);
  const roles = await rolesByAccount(
    db,
    rows.map((row) => row.accountId),
  );
  const listed = rows.map((row) => ({
    accountId: row.accountId,
    name: row.name,
    nim: row.nim,
    studyProgram: row.studyProgram,
    roles: (roles.get(row.accountId) ?? []).filter(isBamRole),
    isActive: isActiveStudent(row),
  }));
  return { students: listed, total, page };
}
