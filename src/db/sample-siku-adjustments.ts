import { daysAfter } from "@/academic-periods/days-after";
import type { SikuKind, SikuReason } from "@/features/siku/siku-ids";

/*
 * Made-up SIKU entries only, for the made-up students.
 */

/** A sample SIKU entry, its day counted back from today. */
export interface SampleSikuEntry {
  kind: SikuKind;
  reason: SikuReason;
  points: number;
  daysAgo: number;
  note: string;
  basis: string;
  /** The NIMs of the Aktif sample students it names. */
  nims: string[];
  /** Who entered it: the sample Penilai Mahasiswa or Kepala Unit. */
  enteredAs: "assessor" | "head_of_unit";
  /** Days ago it was cancelled, or null for one in force. */
  cancelledDaysAgo: number | null;
}

/**
 * The sample entries: gains and losses over the last weeks and one
 * from the semester before, which keeps counting; one cancelled; and
 * losses that take one student below 0, where SIKU stops.
 */
export const SAMPLE_SIKU_ENTRIES: SampleSikuEntry[] = [
  {
    kind: "gain",
    reason: "training_speaker",
    points: 3,
    daysAgo: 200,
    note: "Narasumber pelatihan penulisan laporan keuangan.",
    basis: "",
    nims: ["9900230001", "9900250005"],
    enteredAs: "head_of_unit",
    cancelledDaysAgo: null,
  },
  {
    kind: "gain",
    reason: "spiritual_activity",
    points: 2,
    daysAgo: 40,
    note: "Pengurus kegiatan ibadah rutin asrama.",
    basis: "",
    nims: [
      "9900230001",
      "9900240002",
      "9900250003",
      "9900250005",
      "9900230006",
      "9900250007",
    ],
    enteredAs: "assessor",
    cancelledDaysAgo: null,
  },
  {
    kind: "gain",
    reason: "knowledge_sharing",
    points: 3,
    daysAgo: 25,
    note: "Berbagi pengetahuan literasi keuangan untuk mahasiswa baru.",
    basis: "",
    nims: ["9900250003", "9900240008", "9900250009"],
    enteredAs: "assessor",
    cancelledDaysAgo: null,
  },
  {
    kind: "loss",
    reason: "unannounced_absence",
    points: 3,
    daysAgo: 18,
    note: "Tidak hadir apel karakter tanpa keterangan.",
    basis: "",
    nims: ["9900240002", "9900240011", "9900250012", "9900250013"],
    enteredAs: "assessor",
    cancelledDaysAgo: null,
  },
  {
    kind: "loss",
    reason: "student_violation",
    points: 30,
    daysAgo: 15,
    note: "Pelanggaran berat tata tertib asrama.",
    basis: "",
    nims: ["9900250013"],
    enteredAs: "assessor",
    cancelledDaysAgo: null,
  },
  {
    kind: "loss",
    reason: "student_violation",
    points: 30,
    daysAgo: 14,
    note: "Pelanggaran berat tata tertib asrama yang berulang.",
    basis: "",
    nims: ["9900250013"],
    enteredAs: "assessor",
    cancelledDaysAgo: null,
  },
  {
    kind: "gain",
    reason: "social_media_campaign",
    points: 2,
    daysAgo: 12,
    note: "Kampanye anti-perundungan di media sosial himpunan.",
    basis: "",
    nims: ["9900240014"],
    enteredAs: "assessor",
    cancelledDaysAgo: 11,
  },
  {
    kind: "gain",
    reason: "peer_mentoring",
    points: 2,
    daysAgo: 9,
    note: "Tutor sebaya mata kuliah akuntansi.",
    basis: "",
    nims: ["9900230001", "9900240015", "9900250016"],
    enteredAs: "assessor",
    cancelledDaysAgo: null,
  },
  {
    kind: "loss",
    reason: "discipline_penalty",
    points: 5,
    daysAgo: 6,
    note: "Hukuman disiplin ringan.",
    basis: "",
    nims: ["9900240011"],
    enteredAs: "assessor",
    cancelledDaysAgo: null,
  },
  {
    kind: "loss",
    reason: "director_decision",
    points: 4,
    daysAgo: 3,
    note: "Tidak mengikuti kegiatan wajib kampus.",
    basis: "Surat Keputusan contoh Nomor KEP-01/2026",
    nims: ["9900250017"],
    enteredAs: "head_of_unit",
    cancelledDaysAgo: null,
  },
];

/** The day of a sample entry, counted back from today on campus. */
export function sampleEntryDay(today: string, daysAgo: number): string {
  return daysAfter(today, -daysAgo);
}
