import type { LeaveKind, LeaveStatus, SpecialReason } from "./leave-ids";

/*
 * How the screens name the kinds and statuses of leave. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

/** Each kind by its full name, as the form and the history name it. */
export const KIND_WORDS: Record<LeaveKind, string> = {
  outing: "Izin pesiar",
  skip_activities: "Izin Tidak Mengikuti Kegiatan (ITMK)",
  special: "Izin khusus",
};

/** Each kind by its short name, as a card and the filter name it. */
export const KIND_SHORT_WORDS: Record<LeaveKind, string> = {
  outing: "Pesiar",
  skip_activities: "ITMK",
  special: "Khusus",
};

/** The rule of each kind, as the form and Ketentuan say it. */
export const KIND_RULES: Record<LeaveKind, string> = {
  outing: "Keluar kampus tanpa bermalam, kurang dari 12 jam.",
  skip_activities:
    "Tidak mengikuti kegiatan asrama pada rentang jam tertentu, misalnya kuliah pengganti, tugas, atau kegiatan organisasi. Kegiatan asrama dalam rentang itu otomatis tercatat hadir dengan keterangan ITMK.",
  special:
    "Keperluan tertentu di luar izin pesiar, termasuk bermalam di luar asrama, misalnya sakit, urusan keluarga, atau tugas lomba.",
};

export const STATUS_WORDS: Record<LeaveStatus, string> = {
  submitted: "Diajukan",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  completed: "Selesai",
};

export const SPECIAL_REASON_WORDS: Record<SpecialReason, string> = {
  sick: "Sakit atau berobat",
  family: "Urusan keluarga",
  competition: "Kegiatan lomba atau tugas institusi",
  administration: "Keperluan administrasi",
  other: "Lainnya",
};

/** The names of the start and the end of a leave of a kind. */
export function timeLabels(kind: LeaveKind): { start: string; end: string } {
  if (kind === "skip_activities") return { start: "Dari", end: "Sampai" };
  return { start: "Berangkat", end: "Kembali" };
}
