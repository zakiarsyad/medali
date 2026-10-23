import type {
  AssignmentKind,
  CounsellingHour,
  CounsellingTopic,
  CounsellingWay,
  ScheduleStatus,
  ScheduleStep,
} from "@/mental-health/schedule-ids";

/*
 * Made-up requests for counselling only, for the made-up students.
 */

/** One step of a sample request, some days ago. */
export interface SampleScheduleStep {
  step: ScheduleStep;
  statusAfter: ScheduleStatus;
  daysAgo: number;
}

/** A sample student's voluntary request, with every step of it, oldest first. */
export interface SampleSchedule {
  nim: string;
  topic: CounsellingTopic;
  /**
   * How many days after today the time it is about now falls, before
   * today for one finished, moved to the Senin after when that is Sabtu
   * or Minggu.
   */
  inDays: number;
  hour: CounsellingHour;
  way: CounsellingWay;
  story: string | null;
  counsellorMessage: string | null;
  reason: string | null;
  steps: SampleScheduleStep[];
}

const registered = (daysAgo: number): SampleScheduleStep => ({
  step: "register",
  statusAfter: "submitted",
  daysAgo,
});

/**
 * One request in every status. Bayu Santoso waits for Konselor; Citra
 * Nasution has another time proposed, to accept or answer after picking
 * her on Ganti peran; Dimas Halim is scheduled in the coming days; Hadi
 * Kurniawan asked for another time with a reason. Bayu also had a
 * session Selesai and cancelled another, and Citra did not come to one,
 * so both have a Riwayat. Fikri Wibowo's session has had its day, for
 * Konselor to mark Selesai or Tidak hadir; he withdrew his consent after
 * it was scheduled, and it stays. Every other one has a consent that is
 * Disetujui. A finished one is about a day gone by, marked a few days
 * after it.
 */
export const SAMPLE_SCHEDULES: SampleSchedule[] = [
  {
    nim: "9900240002",
    topic: "emotions_and_stress",
    inDays: 3,
    hour: "10:00",
    way: "in_person",
    story: "Akhir-akhir ini saya sulit tidur menjelang ujian.",
    counsellorMessage: null,
    reason: null,
    steps: [registered(1)],
  },
  {
    nim: "9900250003",
    topic: "academic",
    inDays: 4,
    hour: "13:00",
    way: "online",
    story: null,
    counsellorMessage: "Pada jam yang Anda pilih saya ada sesi lain.",
    reason: null,
    steps: [
      registered(4),
      { step: "propose", statusAfter: "proposed", daysAgo: 2 },
    ],
  },
  {
    nim: "9900240004",
    topic: "campus_adjustment",
    inDays: 2,
    hour: "08:30",
    way: "in_person",
    story: "Saya masih menyesuaikan diri dengan kehidupan asrama.",
    counsellorMessage: null,
    reason: null,
    steps: [
      registered(5),
      { step: "approve", statusAfter: "scheduled", daysAgo: 4 },
    ],
  },
  {
    nim: "9900240008",
    topic: "finances",
    inDays: 6,
    hour: "14:30",
    way: "in_person",
    story: null,
    counsellorMessage: "Bisakah pada hari lain?",
    reason: "Bentrok dengan ujian tengah semester.",
    steps: [
      registered(7),
      { step: "propose", statusAfter: "proposed", daysAgo: 6 },
      { step: "ask_another", statusAfter: "submitted", daysAgo: 3 },
    ],
  },
  {
    nim: "9900240002",
    topic: "academic",
    inDays: -14,
    hour: "13:00",
    way: "in_person",
    story: null,
    counsellorMessage: null,
    reason: null,
    steps: [
      registered(18),
      { step: "approve", statusAfter: "scheduled", daysAgo: 16 },
      { step: "mark_done", statusAfter: "done", daysAgo: 11 },
    ],
  },
  {
    nim: "9900240002",
    topic: "social_relations",
    inDays: -7,
    hour: "08:30",
    way: "online",
    story: null,
    counsellorMessage: null,
    reason: null,
    steps: [
      registered(10),
      { step: "cancel", statusAfter: "cancelled", daysAgo: 8 },
    ],
  },
  {
    nim: "9900250003",
    topic: "family",
    inDays: -7,
    hour: "10:00",
    way: "in_person",
    story: null,
    counsellorMessage: null,
    reason: null,
    steps: [
      registered(12),
      { step: "approve", statusAfter: "scheduled", daysAgo: 10 },
      { step: "mark_missed", statusAfter: "missed", daysAgo: 4 },
    ],
  },
  {
    nim: "9900230006",
    topic: "emotions_and_stress",
    inDays: -2,
    hour: "10:00",
    way: "in_person",
    story: "Saya ingin membicarakan cara mengatur waktu belajar.",
    counsellorMessage: null,
    reason: null,
    steps: [
      registered(12),
      { step: "approve", statusAfter: "scheduled", daysAgo: 11 },
    ],
  },
];

/** The time Konselor set for a sample assignment. */
export interface SampleAssignmentTime {
  /** As `inDays` of a voluntary request. */
  inDays: number;
  hour: CounsellingHour;
  way: CounsellingWay;
}

/**
 * A sample assignment of one sample student: Penugasan from Pembina
 * Disiplin Mahasiswa or Pemanggilan from Penilai Mahasiswa, with every
 * step of it, oldest first, the first being the sender's.
 */
export interface SampleAssignment {
  nim: string;
  kind: AssignmentKind;
  /** Null while it waits for Konselor to set a time. */
  time: SampleAssignmentTime | null;
  /** "Dasar": the Kategori and Jenjang, or the reason of the call. */
  basis: string;
  /**
   * Whether a Penugasan was sent from the student's one sample discipline
   * penalty; one sent before it stands on its own.
   */
  fromPenalty: boolean;
  senderMessage: string | null;
  counsellorMessage: string | null;
  reason: string | null;
  steps: SampleScheduleStep[];
}

const sent = (kind: AssignmentKind, daysAgo: number): SampleScheduleStep => ({
  step: kind === "assigned" ? "assign" : "call",
  statusAfter: "awaiting",
  daysAgo,
});

const timeSet = (daysAgo: number): SampleScheduleStep => ({
  step: "set_time",
  statusAfter: "scheduled",
  daysAgo,
});

/**
 * One assignment in every status. Kirana Utomo's Penugasan waits for its
 * time, and so does Fikri Wibowo's Pemanggilan, beside his voluntary
 * request. Gita Purba, who declined consent, and Lutfi Tarigan have a
 * time set. A Pemanggilan is of a student Asesmen karakter lists, sent
 * after the assessment that lists them, with the reason the app writes
 * and no Pesan pengirim. Nanda Gunawan asked for
 * another time. Mega Saragih came to hers and Oki Rahayu did not. Each
 * Penugasan is of a student with a sample discipline penalty, and was
 * sent from it, but for Mega Saragih's: it was sent before her penalty
 * of this semester, which still has none.
 */
export const SAMPLE_ASSIGNMENTS: SampleAssignment[] = [
  {
    nim: "9900240011",
    kind: "assigned",
    time: null,
    basis: "Pelanggaran disiplin sedang jenjang pertama",
    fromPenalty: true,
    senderMessage: "Mohon pendampingan terkait keterlambatan yang berulang.",
    counsellorMessage: null,
    reason: null,
    steps: [sent("assigned", 3)],
  },
  {
    nim: "9900230006",
    kind: "called",
    time: null,
    basis:
      "Asesmen karakter: rerata 70,0, pembinaan ringan, aspek terlemah Disiplin",
    fromPenalty: false,
    senderMessage: null,
    counsellorMessage: null,
    reason: null,
    steps: [sent("called", 2)],
  },
  {
    nim: "9900250007",
    kind: "assigned",
    time: { inDays: 2, hour: "10:00", way: "in_person" },
    basis: "Pelanggaran disiplin ringan jenjang pertama",
    fromPenalty: true,
    senderMessage: null,
    counsellorMessage: "Silakan datang ke Ruang Konseling.",
    reason: null,
    steps: [sent("assigned", 6), timeSet(5)],
  },
  {
    nim: "9900250012",
    kind: "called",
    time: { inDays: 4, hour: "08:30", way: "online" },
    basis:
      "Asesmen karakter: rerata 58,0, pembinaan intensif, aspek terlemah Disiplin",
    fromPenalty: false,
    senderMessage: null,
    counsellorMessage: null,
    reason: null,
    steps: [sent("called", 4), timeSet(3)],
  },
  {
    nim: "9900240014",
    kind: "assigned",
    time: { inDays: 5, hour: "13:00", way: "in_person" },
    basis: "Pelanggaran disiplin sedang jenjang kedua",
    fromPenalty: true,
    senderMessage: null,
    counsellorMessage: null,
    reason: "Bentrok dengan praktikum.",
    steps: [
      sent("assigned", 9),
      timeSet(8),
      { step: "ask_another", statusAfter: "reschedule_asked", daysAgo: 2 },
    ],
  },
  {
    nim: "9900250013",
    kind: "assigned",
    time: { inDays: -6, hour: "08:30", way: "in_person" },
    basis: "Pelanggaran disiplin ringan jenjang pertama",
    fromPenalty: false,
    senderMessage: null,
    counsellorMessage: null,
    reason: null,
    steps: [
      sent("assigned", 15),
      timeSet(14),
      { step: "mark_done", statusAfter: "done", daysAgo: 5 },
    ],
  },
  {
    nim: "9900240015",
    kind: "assigned",
    time: { inDays: -4, hour: "14:30", way: "in_person" },
    basis: "Pelanggaran disiplin berat jenjang pertama",
    fromPenalty: true,
    senderMessage: null,
    counsellorMessage: null,
    reason: null,
    steps: [
      sent("assigned", 12),
      timeSet(11),
      { step: "mark_missed", statusAfter: "missed", daysAgo: 3 },
    ],
  },
];

/** The steps the student takes; every other is Konselor's or the sender's. */
const STUDENT_STEPS: readonly ScheduleStep[] = [
  "register",
  "accept",
  "ask_another",
  "cancel",
];

/** The steps that send an assignment. */
const SENDER_STEPS: readonly ScheduleStep[] = ["assign", "call"];

/** Whether the student took the step. */
export function isStudentScheduleStep(step: ScheduleStep): boolean {
  return STUDENT_STEPS.includes(step);
}

/** Whether the sender of an assignment took the step. */
export function isSenderScheduleStep(step: ScheduleStep): boolean {
  return SENDER_STEPS.includes(step);
}
