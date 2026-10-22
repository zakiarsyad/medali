import type {
  SharedData,
  SharingRecipient,
  SharingStep,
} from "@/mental-health/sharing-ids";

/*
 * Made-up sharings of counselling data only, for the made-up students.
 */

/** One step of a sample sharing, some days ago. */
export interface SampleSharingStep {
  step: SharingStep;
  daysAgo: number;
}

/** A sample request to share, with every step of it, oldest first. */
export interface SampleSharing {
  nim: string;
  data: SharedData[];
  recipients: SharingRecipient[];
  summary: string | null;
  steps: SampleSharingStep[];
}

const at = (step: SharingStep, daysAgo: number): SampleSharingStep => ({
  step,
  daysAgo,
});

/** The steps the student takes themselves; Konselor takes every other. */
export function isStudentSharingStep(step: SampleSharingStep): boolean {
  return (
    step.step === "approve" ||
    step.step === "decline" ||
    step.step === "withdraw" ||
    step.step === "consent_withdrawn"
  );
}

/**
 * One current sharing in each current status, and ended ones of every
 * kind. Bayu Santoso declined a first request, then approved one that
 * is published with his screening level, so his page shows "Data
 * dibagikan" and his Pengasuh sees his level. Citra Nasution's
 * first was published and then taken back by Konselor; a new request
 * waits, so it can be answered after picking her on Ganti peran. Dimas
 * Halim approved on paper, so Konselor can publish it. Fikri Wibowo
 * withdrew one himself, and another stopped when he withdrew his
 * consent to counselling 6 days ago. Nanda Gunawan's is published to
 * all four recipients, so Kepala Unit, Direktur, his Ketua Program Studi
 * and his Pengasuh of today each read it, and his Pengasuh before does
 * not.
 */
export const SAMPLE_SHARINGS: SampleSharing[] = [
  {
    nim: "9900240002",
    data: ["counselling"],
    recipients: ["mentor", "head_of_unit"],
    summary: null,
    steps: [at("ask", 9), at("decline", 8)],
  },
  {
    nim: "9900240002",
    data: ["level", "counselling", "summary"],
    recipients: ["mentor", "head_of_program"],
    summary:
      "Mahasiswa sedang dalam pendampingan rutin. Mohon pengasuh memberi ruang dan memantau kehadiran.",
    steps: [at("ask", 4), at("approve", 3), at("publish", 2)],
  },
  {
    nim: "9900250003",
    data: ["counselling"],
    recipients: ["mentor"],
    summary: null,
    steps: [at("ask", 8), at("approve", 7), at("publish", 6), at("cancel", 5)],
  },
  {
    nim: "9900250003",
    data: ["summary"],
    recipients: ["mentor", "director"],
    summary: "Mahasiswa aktif mengikuti sesi kelompok adaptasi kampus.",
    steps: [at("ask", 1)],
  },
  {
    nim: "9900240004",
    data: ["counselling"],
    recipients: ["head_of_unit", "mentor"],
    summary: null,
    steps: [at("ask", 3), at("record_paper", 2)],
  },
  {
    nim: "9900230006",
    data: ["counselling"],
    recipients: ["mentor"],
    summary: null,
    steps: [at("ask", 20), at("approve", 19), at("withdraw", 15)],
  },
  {
    nim: "9900230006",
    data: ["counselling", "summary"],
    recipients: ["head_of_unit"],
    summary: "Mahasiswa berlatih mengatur waktu belajar dan istirahat.",
    steps: [
      at("ask", 10),
      at("approve", 9),
      at("publish", 8),
      at("consent_withdrawn", 6),
    ],
  },
  {
    nim: "9900240014",
    data: ["counselling", "summary"],
    recipients: ["head_of_unit", "director", "head_of_program", "mentor"],
    summary:
      "Mahasiswa sedang menata jadwal belajar. Mohon beri ruang saat ujian dan pantau kehadirannya.",
    steps: [at("ask", 6), at("approve", 5), at("publish", 4)],
  },
];
