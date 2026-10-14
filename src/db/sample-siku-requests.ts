import type { SikuReason } from "@/features/siku/siku-ids";
import {
  APPROVED_REQUEST_GAIN,
  CANCELLED_REQUEST_GAIN,
  type SampleSikuEntry,
} from "./sample-siku-adjustments";

/*
 * Made-up requests for a SIKU gain only, of the made-up students.
 */

/** What became of a sample request, its days counted back from today. */
export type SampleRequestDecision =
  | { kind: "waiting" }
  | { kind: "approved"; gain: SampleSikuEntry; note: string }
  | { kind: "rejected"; daysAgo: number; note: string }
  | { kind: "withdrawn"; daysAgo: number };

export interface SampleSikuRequest {
  /** The NIM of an Aktif sample student. */
  nim: string;
  reason: SikuReason;
  /** Days ago the deed was done, which is Tanggal kegiatan. */
  daysAgo: number;
  /** Days ago it was sent. */
  sentDaysAgo: number;
  report: string;
  /** How many drawn photos it holds. */
  photos: number;
  decision: SampleRequestDecision;
}

/**
 * The sample requests: three that wait, one approved, one approved whose
 * gain was cancelled since, one rejected and one withdrawn. An approved
 * one has the day, the reason and the student of its gain, which is
 * among the sample SIKU entries and was made the day it was sent.
 */
export const SAMPLE_SIKU_REQUESTS: SampleSikuRequest[] = [
  {
    nim: "9900230001",
    reason: "knowledge_sharing",
    daysAgo: 4,
    sentDaysAgo: 3,
    report:
      "Mengisi sesi berbagi pengetahuan tentang literasi keuangan untuk 40 mahasiswa tingkat 1 di aula asrama.",
    photos: 2,
    decision: { kind: "waiting" },
  },
  {
    nim: "9900250003",
    reason: "social_media_campaign",
    daysAgo: 3,
    sentDaysAgo: 2,
    report:
      "Membuat dan mengunggah tiga konten kampanye anti-perundungan di akun media sosial himpunan.",
    photos: 1,
    decision: { kind: "waiting" },
  },
  {
    nim: "9900240008",
    reason: "peer_mentoring",
    daysAgo: 2,
    sentDaysAgo: 1,
    report:
      "Membimbing tiga mahasiswa lain mempersiapkan ujian mata kuliah Pengantar Akuntansi selama dua pertemuan.",
    photos: 3,
    decision: { kind: "waiting" },
  },
  {
    nim: APPROVED_REQUEST_GAIN.nims[0] ?? "",
    reason: APPROVED_REQUEST_GAIN.reason,
    daysAgo: APPROVED_REQUEST_GAIN.daysAgo,
    sentDaysAgo: APPROVED_REQUEST_GAIN.daysAgo,
    report: APPROVED_REQUEST_GAIN.note,
    photos: 2,
    decision: {
      kind: "approved",
      gain: APPROVED_REQUEST_GAIN,
      note: "Laporan dan foto sesuai.",
    },
  },
  {
    nim: CANCELLED_REQUEST_GAIN.nims[0] ?? "",
    reason: CANCELLED_REQUEST_GAIN.reason,
    daysAgo: CANCELLED_REQUEST_GAIN.daysAgo,
    sentDaysAgo: CANCELLED_REQUEST_GAIN.daysAgo,
    report: CANCELLED_REQUEST_GAIN.note,
    photos: 1,
    decision: { kind: "approved", gain: CANCELLED_REQUEST_GAIN, note: "" },
  },
  {
    nim: "9900230001",
    reason: "spiritual_activity",
    daysAgo: 20,
    sentDaysAgo: 19,
    report: "Menjadi petugas kultum kegiatan spiritual asrama.",
    photos: 1,
    decision: {
      kind: "rejected",
      daysAgo: 18,
      note: "Kegiatan sudah tercatat pada penambahan kolektif kegiatan spiritual.",
    },
  },
  {
    nim: "9900250005",
    reason: "peer_mentoring",
    daysAgo: 6,
    sentDaysAgo: 5,
    report:
      "Mendampingi dua mahasiswa baru belajar menyusun laporan keuangan sederhana.",
    photos: 1,
    decision: { kind: "withdrawn", daysAgo: 4 },
  },
];
