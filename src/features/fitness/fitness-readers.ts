import { type SQL, sql } from "drizzle-orm";
import {
  type AccountForAccess,
  rowLimitForAction,
  rowLimitForTab,
} from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import { dormInSql } from "@/dorms/resident-condition";

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
 * and Ketua Program Studi nobody's. A dorm resident's notes follow the
 * dorm list too: only an account whose roles see the resident there reads
 * them, so Penilai Mahasiswa reads none. The angkatan years given are
 * those in a semester that lives in the dorm.
 */
export function healthReadableTo(
  account: AccountForAccess,
  dormCohorts: number[],
): SQL {
  const readsNotes = visibleTo(rowLimitForAction(account, "view_health_notes"));
  const readsDormNotes = visibleTo(
    rowLimitForAction(account, "view_dorm_health_notes"),
  );
  const livesInNoDorm = sql`${dormInSql(dormCohorts)} is null`;
  return sql`(${readsNotes} and (${livesInNoDorm} or ${readsDormNotes}))`;
}
