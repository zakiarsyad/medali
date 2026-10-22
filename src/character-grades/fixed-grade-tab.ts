import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import type { GradeParams } from "@/features/character-grades/grade-address";
import {
  type FixedGradeList,
  readFixedGradeNumbers,
  readFixedGradePage,
  readFixedSikuBase,
} from "./fixed-grade-page";
import type { GradeNumbers } from "./grade-numbers";
import { fixedGradeVisibleTo, fixedNameOpensFor } from "./grade-students";

/** What Penilaian karakter shows of a closed semester. */
export interface FixedGradeTab {
  list: FixedGradeList;
  numbers: GradeNumbers;
  /** Nilai dasar SIKU at the closing, or null when it cannot be told. */
  sikuBase: number | null;
}

/**
 * The fixed grades of one closing an account may read, within the rows
 * of its roles with the right, or "refused" for an account without it.
 */
export async function readFixedGradeTab(
  db: Database,
  account: AccountForAccess,
  closingId: string,
  params: GradeParams,
): Promise<FixedGradeTab | "refused"> {
  const visible = fixedGradeVisibleTo(account);
  if (visible === null) return "refused";
  const opens = fixedNameOpensFor(account);
  const [list, numbers, sikuBase] = await Promise.all([
    readFixedGradePage(db, visible, opens, closingId, params),
    readFixedGradeNumbers(db, visible, closingId),
    readFixedSikuBase(db, closingId),
  ]);
  return { list, numbers, sikuBase };
}
