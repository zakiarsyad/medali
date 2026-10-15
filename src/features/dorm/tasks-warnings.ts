import { and, asc, desc, isNotNull, ne, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { roomWords } from "./leave-list";
import type { TaskSection, WarningTask } from "./tasks-card";
import { readCallNumbers, readStandingPage } from "./warning-calls";
import { letterMark } from "./warning-rule";
import { readWarningSemester, standingsOf } from "./warning-standing";

const EMPTY: TaskSection<WarningTask> = { items: [], total: 0 };

/**
 * The students `visible` holds but the account's own, whose SP another
 * Pengelola Asrama sets, as on Pelanggaran.
 */
export function othersThan(visible: SQL, ownStudentId: string | null): SQL {
  if (ownStudentId === null) return visible;
  return and(visible, ne(students.id, ownStudentId)) ?? visible;
}

/**
 * How many students `visible` holds are due for an SP in the running
 * semester at `now`, by the same rule as the calls on Pelanggaran; none
 * while no period is stored.
 */
export async function countDueForLetter(
  db: Database,
  visible: SQL,
  now: Date,
): Promise<number> {
  const semester = await readWarningSemester(db, now);
  if (semester === null) return 0;
  const standing = standingsOf(db, semester, now);
  const numbers = await readCallNumbers(db, standing, visible);
  return numbers.active;
}

/**
 * "Penetapan SP": the students `visible` holds who are due for an SP in
 * the running semester at `now`, by the same rule as the calls on
 * Pelanggaran, the highest SP first and then by name, as many as a page
 * of those calls holds, with how many are due in all.
 */
export async function readWarningSection(
  db: Database,
  visible: SQL,
  dorm: SQL<DormId | null>,
  now: Date,
): Promise<TaskSection<WarningTask>> {
  const semester = await readWarningSemester(db, now);
  if (semester === null) return EMPTY;
  const standing = standingsOf(db, semester, now);
  const [numbers, rows] = await Promise.all([
    readCallNumbers(db, standing, visible),
    readStandingPage(
      db,
      standing,
      and(visible, isNotNull(standing.level)),
      [desc(standing.level), asc(students.name), asc(students.nim)],
      dorm,
      1,
    ),
  ]);
  const items: WarningTask[] = [];
  for (const row of rows) {
    if (row.level === null) continue;
    items.push({
      studentId: row.studentId,
      name: row.name,
      nim: row.nim,
      room: roomWords(row.dorm, row.room),
      level: row.level,
      mark: letterMark(row),
      counted: row.counted,
      rejected: row.rejected,
    });
  }
  return { items, total: numbers.active };
}
