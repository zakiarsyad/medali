import type { NotePunishment } from "@/features/guidance/violation-note-ids";

/*
 * Made-up violation notes only, for the made-up students.
 */

/** A sample note of one sample student. */
export interface SampleViolationNote {
  nim: string;
  /** 0 for the running semester, 1 for the one before it. */
  semester: 0 | 1;
  /**
   * In the running semester, how many days before today, or its first
   * day when that is later; in the one before, how many days after its
   * first day.
   */
  days: number;
  description: string;
  punishment: NotePunishment;
  otherPunishment: string;
  remark: string;
  savedAs: "discipline_officer" | "head_of_unit";
}

const NOTE = {
  punishment: "warning",
  otherPunishment: "",
  remark: "",
  savedAs: "discipline_officer",
} as const;

/**
 * Notes of this semester, with Mega Saragih of D3 Pajak twice, so her
 * second is "Pelanggaran lanjutan" and she is "Mahasiswa berulang", and
 * Nanda Gunawan of D3 Pajak once, so the sample Ketua Program Studi sees
 * both; one with Hukuman lainnya and one with Keterangan. Mega also has
 * a note of the semester before, which no longer counts, and so does
 * Hadi Kurniawan.
 */
export const SAMPLE_VIOLATION_NOTES: SampleViolationNote[] = [
  {
    ...NOTE,
    nim: "9900250013",
    semester: 0,
    days: 20,
    description: "Terlambat mengikuti apel pagi",
  },
  {
    ...NOTE,
    nim: "9900250013",
    semester: 0,
    days: 6,
    description: "Kembali terlambat mengikuti apel pagi",
  },
  {
    ...NOTE,
    nim: "9900240014",
    semester: 0,
    days: 12,
    description: "Tidak memakai atribut lengkap saat kegiatan resmi",
    punishment: "direct_guidance",
    remark: "Lupa membawa papan nama; sudah diingatkan langsung.",
  },
  {
    ...NOTE,
    nim: "9900230001",
    semester: 0,
    days: 9,
    description: "Membuat kegaduhan di ruang belajar",
    punishment: "other",
    otherPunishment: "Membersihkan ruang belajar",
    savedAs: "head_of_unit",
  },
  {
    ...NOTE,
    nim: "9900250005",
    semester: 0,
    days: 3,
    description: "Tidak mengikuti piket kebersihan kamar",
    punishment: "direct_guidance",
  },
  {
    ...NOTE,
    nim: "9900250013",
    semester: 1,
    days: 30,
    description: "Meninggalkan kegiatan sebelum selesai tanpa izin",
  },
  {
    ...NOTE,
    nim: "9900240008",
    semester: 1,
    days: 45,
    description: "Terlambat mengikuti apel pagi",
    punishment: "direct_guidance",
    savedAs: "head_of_unit",
  },
];
