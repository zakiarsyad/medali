import { and, inArray, type SQL, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import type { CharacterGrade } from "./character-grade";
import type { GradeChoice } from "./grade-choice";
import { gradeFacts, readGradeBasis } from "./grade-facts";
import { readGradeRows } from "./grade-rows";
import { readGradeScheme } from "./grade-scheme";

/**
 * The grade now, by the scheme in force, of those of `ids` that `visible`
 * lets through: the students of one page of a list, read once for all
 * of them. A student who is not Aktif has no grade and no entry here.
 */
export async function readGradesOf(
  db: Database,
  visible: SQL,
  ids: readonly string[],
  today: string,
): Promise<Map<string, CharacterGrade>> {
  if (ids.length === 0) return new Map();
  const { scheme } = await readGradeScheme(db);
  const asked = and(visible, inArray(students.id, [...ids])) ?? visible;
  const { rows } = await readGradeRows(db, asked, scheme, today);
  return new Map(rows.map((row) => [row.student.id, row.grade]));
}

/**
 * The students of `visible` whose grade now reaches the pass letter, or
 * does not, for the `where` of a list, so the database filters, counts
 * and pages it. A grade that is "Belum lengkap" is in neither.
 */
export async function gradeChoiceSql(
  db: Database,
  visible: SQL,
  choice: GradeChoice,
  today: string,
): Promise<SQL> {
  const { scheme } = await readGradeScheme(db);
  const basis = await readGradeBasis(db, scheme, today);
  const facts = gradeFacts(db, visible, basis);
  const passing = choice === "passing";
  const chosen = db
    .select({ id: facts.studentId })
    .from(facts)
    .where(sql`${facts.passes} = ${passing}`);
  return inArray(students.id, chosen);
}
