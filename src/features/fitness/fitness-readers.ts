import type { SQL } from "drizzle-orm";
import { type AccountForAccess, rowLimitForTab } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";

/**
 * The students whose fitness scores an account sees: those its roles
 * that open Penilaian jasmani see. Ketua Program Studi sees their own
 * program, Pengasuh their own mentees; a role without the tab adds
 * nobody, so a student or Konselor sees no one.
 */
export function fitnessVisibleTo(account: AccountForAccess): SQL {
  return visibleTo(rowLimitForTab(account, "assessment", "fitness"));
}
