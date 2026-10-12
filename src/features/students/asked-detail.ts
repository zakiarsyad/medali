import { forbidden } from "next/navigation";
import type { AccountForAccess } from "@/auth/access";
import { database } from "@/db/database";
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
  const answer = await readStudentDetail(database(), account, detailId);
  if (answer.kind === "refused") forbidden();
  return answer;
}
