import { clarificationListAddress } from "./clarification-address";
import { CLEANING_ADDRESS } from "./cleaning-address";
import { type LeaveFilters, leaveListAddress } from "./leave-address";
import {
  readStaffViolationParams,
  staffViolationsAddress,
  VIOLATIONS_ADDRESS,
} from "./violation-address";

/*
 * Where the parts of Tugas saya lead. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

/** Where the number cards jump to: the sections of the page. */
export const LEAVE_SECTION_ID = "tugas-izin";
export const RETURN_SECTION_ID = "tugas-lapor";
export const CLARIFICATION_SECTION_ID = "tugas-klar";
export const CLEANING_SECTION_ID = "tugas-bersih";
export const WARNING_SECTION_ID = "tugas-sp";

function onPerizinan(status: LeaveFilters["status"]): string {
  return leaveListAddress({ query: "", status, kind: "all" });
}

/** Perizinan asrama at Menunggu verifikasi: every request that waits. */
export const ALL_WAITING_LEAVE_ADDRESS = onPerizinan("submitted");

/** Perizinan asrama at Laporan kembali menunggu: every report that waits. */
export const ALL_WAITING_REPORTS_ADDRESS = onPerizinan("reports");

/** Perizinan asrama at Terlambat kembali: those still out late among them. */
export const LATE_ADDRESS = onPerizinan("late");

/** Klarifikasi kehadiran at Diverifikasi BAM: every one BAM passed on. */
export const ALL_PASSED_ON_ADDRESS = clarificationListAddress({
  query: "",
  status: "verified",
});

/** Pembersihan asrama, whose "Menunggu validasi" counts every assessment that waits. */
export const ALL_ASSESSED_ADDRESS = CLEANING_ADDRESS;

/**
 * Pelanggaran, whose "Panggilan klarifikasi dan surat peringatan" lists
 * every student due for an SP, and whose "Advokasi masuk" BAM decides.
 */
export const ALL_DUE_ADDRESS = VIOLATIONS_ADDRESS;

/**
 * Pelanggaran with "Proses" of a student open over it, the SP form in
 * view, also after a refresh or from a shared link.
 */
export function processLetterAddress(studentId: string): string {
  return staffViolationsAddress({
    ...readStaffViolationParams({}),
    callStudentId: studentId,
  });
}
