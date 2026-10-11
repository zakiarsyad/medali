import { ilike, isNull, or, type SQL, sql } from "drizzle-orm";
import { containsPattern } from "@/db/contains-pattern";
import { students } from "@/db/schema";

/** The conditions that more than one list of students reads by. */

export const NOT_REMOVED = isNull(students.deletedAt);

/** Students whose name or NIM holds the text. No text finds everyone. */
export function matchesSearch(query: string): SQL | undefined {
  const text = query.trim();
  if (text === "") return undefined;
  const pattern = containsPattern(text);
  return or(ilike(students.name, pattern), ilike(students.nim, pattern));
}

export function countWhere(condition: SQL): SQL<number> {
  return sql`count(*) filter (where ${condition})`.mapWith(Number);
}
