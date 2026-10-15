import type { SQL } from "drizzle-orm";
import { forbidden } from "next/navigation";
import type { AccountForAccess } from "@/auth/access";
import { database } from "@/db/database";
import { runningPeriodNow } from "./running-period-now";
import { type DetailOrBrief, readDetailOrBrief } from "./student-brief";
import { readStudentDetail, type StudentDetailAnswer } from "./student-detail";

/** The answer to the detail an address asks for: found, or not found. */
export type AskedDetail = Exclude<StudentDetailAnswer, { kind: "refused" }>;

/**
 * The detail an address asks for, for the account that opened the page.
 * Null when the address asks for none. An account without the right to a
 * detail is refused the whole page.
 */
export async function askedDetail(
  account: AccountForAccess,
  detailId: string | null,
): Promise<AskedDetail | null> {
  if (detailId === null) return null;
  const period = await runningPeriodNow();
  const answer = await readStudentDetail(database(), account, detailId, period);
  if (answer.kind === "refused") forbidden();
  return answer;
}

/**
 * The student an address asks for over a list of another area, whose
 * rows (`briefVisible`) may hold students the account opens no detail
 * of: those get the brief. Null when the address asks for none.
 */
export async function askedDetailOrBrief(
  account: AccountForAccess,
  detailId: string | null,
  briefVisible: SQL,
): Promise<DetailOrBrief | null> {
  if (detailId === null) return null;
  const period = await runningPeriodNow();
  return readDetailOrBrief(database(), account, detailId, period, briefVisible);
}
