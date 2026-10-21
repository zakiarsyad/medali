import {
  and,
  asc,
  count,
  ilike,
  inArray,
  isNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { Database } from "@/db/connect";
import { containsPattern } from "@/db/contains-pattern";
import { students } from "@/db/schema";
import {
  GRADE_LIST_PAGE_SIZE,
  type GradeFilter,
  type GradeParams,
} from "@/features/character-grades/grade-address";
import { pageWithin } from "@/ui/list-pages";
import { type GradeBasis, gradeFacts } from "./grade-facts";
import type { GradeList } from "./grade-list";
import { readGradeRows } from "./grade-rows";

type Facts = ReturnType<typeof gradeFacts>;

function filterOf(facts: Facts, filter: GradeFilter): SQL | undefined {
  switch (filter) {
    case "all":
      return undefined;
    case "failing":
      return sql`${facts.passes} is false`;
    case "incomplete":
      return isNull(facts.final);
  }
}

function matching(facts: Facts, query: string): SQL | undefined {
  if (query === "") return undefined;
  const pattern = containsPattern(query);
  return or(ilike(facts.name, pattern), ilike(facts.nim, pattern));
}

async function countMatching(
  db: Database,
  facts: Facts,
  where: SQL | undefined,
): Promise<number> {
  const [counted] = await db
    .select({ students: count() })
    .from(facts)
    .where(where);
  return counted?.students ?? 0;
}

/**
 * One page of "Daftar nilai karakter": the Aktif students `visible` lets
 * through who match the search, by name or NIM, and the filter, by name.
 * The database finds, counts and pages them; the parts and the grade are
 * then read for the students of the page only.
 */
export async function readGradePage(
  db: Database,
  visible: SQL,
  basis: GradeBasis,
  today: string,
  params: GradeParams,
): Promise<GradeList> {
  const facts = gradeFacts(db, visible, basis);
  const where = and(
    matching(facts, params.query),
    filterOf(facts, params.filter),
  );
  const total = await countMatching(db, facts, where);
  const page = pageWithin(params.page, total, GRADE_LIST_PAGE_SIZE);
  const shown = await db
    .select({ id: facts.studentId })
    .from(facts)
    .where(where)
    .orderBy(asc(facts.name), asc(facts.nim))
    .limit(GRADE_LIST_PAGE_SIZE)
    .offset((page - 1) * GRADE_LIST_PAGE_SIZE);
  const ids = shown.map((row) => row.id);
  if (ids.length === 0) return { rows: [], matching: total, page };
  const onPage = and(visible, inArray(students.id, ids)) ?? visible;
  const { rows } = await readGradeRows(db, onPage, basis.scheme, today);
  return { rows, matching: total, page };
}
