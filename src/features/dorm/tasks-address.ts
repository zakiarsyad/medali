import { type LeaveFilters, leaveListAddress } from "./leave-address";

/*
 * Where the parts of Tugas saya lead. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

/** Where the number cards jump to: the sections of the page. */
export const LEAVE_SECTION_ID = "tugas-izin";
export const RETURN_SECTION_ID = "tugas-lapor";

function onPerizinan(status: LeaveFilters["status"]): string {
  return leaveListAddress({ query: "", status, kind: "all" });
}

/** Perizinan asrama at Menunggu verifikasi: every request that waits. */
export const ALL_WAITING_LEAVE_ADDRESS = onPerizinan("submitted");

/** Perizinan asrama at Laporan kembali menunggu: every report that waits. */
export const ALL_WAITING_REPORTS_ADDRESS = onPerizinan("reports");

/** Perizinan asrama at Terlambat kembali: those still out late among them. */
export const LATE_ADDRESS = onPerizinan("late");
