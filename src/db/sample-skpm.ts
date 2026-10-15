import type { SkpmUploadMode } from "@/features/skpm/skpm-ids";

/*
 * Made-up SKPM activities only, for the made-up students.
 */

/** One activity of a sample upload, its Tanggal counted back from today. */
export interface SampleSkpmRow {
  nim: string;
  activity: string;
  category: string;
  level: string | null;
  activityRole: string | null;
  /** Days before today the activity was, or null for no Tanggal. */
  daysAgo: number | null;
  points: number;
}

/** A sample SKPM file, saved some days ago. */
export interface SampleSkpmUpload {
  fileName: string;
  mode: SkpmUploadMode;
  daysAgo: number;
  /** Who saved it: the sample Penilai Mahasiswa or Kepala Unit. */
  enteredAs: "assessor" | "head_of_unit";
  /** Days ago the one who saved it removed it, or null for one kept. */
  removedDaysAgo: number | null;
  rows: SampleSkpmRow[];
}

type Activity = Pick<
  SampleSkpmRow,
  "activity" | "category" | "level" | "activityRole"
>;

const BOARD: Activity = {
  activity: "Pengurus himpunan mahasiswa",
  category: "Organisasi kemahasiswaan",
  level: "Kampus",
  activityRole: "Pengurus",
};
const COMMITTEE: Activity = {
  activity: "Panitia dies natalis",
  category: "Kepanitiaan",
  level: "Kampus",
  activityRole: "Anggota",
};
const DEBATE: Activity = {
  activity: "Lomba debat anggaran",
  category: "Lomba atau kompetisi",
  level: "Nasional",
  activityRole: "Peserta",
};
const LITERACY: Activity = {
  activity: "Literasi keuangan UMKM",
  category: "Pengabdian masyarakat",
  level: "Kota/kabupaten",
  activityRole: "Relawan",
};
const SEMINAR: Activity = {
  activity: "Seminar perpajakan",
  category: "Seminar atau pelatihan",
  level: "Kampus",
  activityRole: "Peserta",
};
const SCHOLARSHIP: Activity = {
  activity: "Penerima beasiswa prestasi",
  category: "Prestasi akademik",
  level: "Kampus",
  activityRole: "Penerima",
};
const SUMMARY: Activity = {
  activity: "Rekap poin semester",
  category: "Lainnya",
  level: null,
  activityRole: null,
};

function row(
  nim: string,
  activity: Activity,
  points: number,
  daysAgo: number | null,
): SampleSkpmRow {
  return { nim, ...activity, points, daysAgo };
}

/**
 * The sample uploads, oldest first: one replaced by the later "Ganti
 * semua data", which every student's points now start from, one added
 * after it, and one removed the day after it was saved. Some Aktif
 * students have no row, to show "Belum ada data".
 */
export const SAMPLE_SKPM_UPLOADS: SampleSkpmUpload[] = [
  {
    fileName: "skpm-semester-lalu.csv",
    mode: "add",
    daysAgo: 150,
    enteredAs: "assessor",
    removedDaysAgo: null,
    rows: [
      row("9900230001", SUMMARY, 40, null),
      row("9900240002", SUMMARY, 25, null),
      row("9900250003", SUMMARY, 18, null),
    ],
  },
  {
    fileName: "skpm-rekap-semester.csv",
    mode: "replace",
    daysAgo: 40,
    enteredAs: "head_of_unit",
    removedDaysAgo: null,
    rows: [
      row("9900230001", BOARD, 20, 70),
      row("9900230001", DEBATE, 15, 55),
      row("9900230001", SEMINAR, 5, 48),
      row("9900240002", COMMITTEE, 8, 66),
      row("9900240002", LITERACY, 12, 52),
      row("9900240002", SEMINAR, 10, 47),
      row("9900250003", SEMINAR, 4, 60),
      row("9900250003", COMMITTEE, 6, 58),
      row("9900250005", SCHOLARSHIP, 30, 75),
      row("9900230006", BOARD, 18, 72),
      row("9900230006", LITERACY, 7.5, 50),
      row("9900250007", DEBATE, 12, 64),
      row("9900240008", COMMITTEE, 9, 61),
      row("9900250009", SEMINAR, 3, 45),
      row("9900240011", LITERACY, 10, 59),
      row("9900250012", SEMINAR, 4, null),
    ],
  },
  {
    fileName: "skpm-kegiatan-bulan-ini.csv",
    mode: "add",
    daysAgo: 12,
    enteredAs: "assessor",
    removedDaysAgo: null,
    rows: [
      row("9900250003", DEBATE, 7, 20),
      row("9900240015", COMMITTEE, 8, 18),
      row("9900250016", SEMINAR, 5, 16),
      row("9900250017", LITERACY, 6, 15),
    ],
  },
  {
    fileName: "skpm-salah-unggah.csv",
    mode: "add",
    daysAgo: 6,
    enteredAs: "assessor",
    removedDaysAgo: 5,
    rows: [
      row("9900230001", DEBATE, 100, 10),
      row("9900240002", DEBATE, 100, 10),
    ],
  },
];
