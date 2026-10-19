import type {
  CounsellingHour,
  CounsellingTopic,
  CounsellingWay,
  ScheduleStatus,
  ScheduleStep,
} from "@/features/counselling/schedule-ids";

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
   * How many days after today the time it is about now falls, moved to
   * the Senin after when that is Sabtu or Minggu.
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
 * Kurniawan asked for another time with a reason. Every one of them has
 * a consent that is Disetujui.
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
];

/** Whether the student took the step. Approving and proposing are Konselor's. */
export function isStudentScheduleStep(step: ScheduleStep): boolean {
  return step !== "approve" && step !== "propose";
}
