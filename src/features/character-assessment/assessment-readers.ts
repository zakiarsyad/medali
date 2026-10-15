import type { SQL } from "drizzle-orm";
import { type AccountForAccess, rowLimitForTab } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";

/**
 * The students whose assessments an account sees: those its roles that
 * open Asesmen karakter see. Ketua Program Studi sees their own program,
 * Pengasuh their own mentees; a role without the tab adds nobody.
 */
export function assessmentVisibleTo(account: AccountForAccess): SQL {
  return visibleTo(rowLimitForTab(account, "assessment", "character_test"));
}
