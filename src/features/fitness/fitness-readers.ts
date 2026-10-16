import type { SQL } from "drizzle-orm";
import {
  type AccountForAccess,
  rowLimitForAction,
  rowLimitForTab,
} from "@/auth/access";
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

/**
 * The students whose health notes an account reads on the tab: those its
 * roles with the right to read notes see. Kepala Unit and Penilai
 * Mahasiswa read every student's, Pengasuh their own mentees'; Direktur
 * and Ketua Program Studi nobody's.
 */
export function healthReadableTo(account: AccountForAccess): SQL {
  return visibleTo(rowLimitForAction(account, "view_health_notes"));
}
