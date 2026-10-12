import type { accounts } from "@/db/schema";

type Account = typeof accounts.$inferSelect;

const BETWEEN = " · ";

/**
 * The gelar and the unit of a mentor as one line. One that is not kept is
 * left out, and the line is empty when neither is.
 */
export function titleAndUnit(mentor: Pick<Account, "title" | "unit">): string {
  const words: string[] = [];
  if (mentor.title) words.push(mentor.title);
  if (mentor.unit) words.push(mentor.unit);
  return words.join(BETWEEN);
}
