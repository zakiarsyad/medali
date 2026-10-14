import { daysAfter } from "@/academic-periods/days-after";
import type { AttendanceStatus } from "@/features/activities/attendance-status";
import type {
  ClarificationReason,
  ClarificationStatus,
} from "@/features/activities/clarification-reasons";
import { uploadDeadline } from "@/features/activities/upload-range";
import {
  activeByCohortPlace,
  begunFor,
  campusMoment,
  type SampleActivityAttendance,
  takesClarifications,
} from "./sample-activity-attendances";
import type { SampleActivitySchedule } from "./sample-activity-schedules";
import type { SampleStudent } from "./sample-students";

/*
 * Made-up people only. Every clarification here is invented, and its
 * file is a drawn paper that names nobody.
 */

export interface SampleClarification {
  /** The NIM of the sample student. */
  nim: string;
  schedule: SampleActivitySchedule;
  reason: ClarificationReason;
  explanation: string;
  status: ClarificationStatus;
  /** The status an accepted one gave the attendance. */
  acceptedAs: "valid" | "dispensation" | null;
  note: string;
  sentAt: Date;
  /** When Penilai Mahasiswa decided. Null while it waits. */
  decidedAt: Date | null;
}

/** What becomes of an attendance that could be clarified. */
type Outcome =
  | "not_asked"
  | "submitted"
  | "rejected"
  | "valid"
  | "dispensation";

/**
 * What the students get, in turn, for a schedule that still takes
 * clarifications, and for one whose clarification time is over. So the
 * first student of an angkatan has one left to ask for, one that waits
 * and one that was rejected and can be asked again.
 */
const WHILE_OPEN: Outcome[] = ["not_asked", "submitted", "rejected"];
const AFTER_CLOSING: Outcome[] = [
  "not_asked",
  "valid",
  "not_asked",
  "dispensation",
  "rejected",
  "not_asked",
];

const REQUESTS: { reason: ClarificationReason; explanation: string }[] = [
  {
    reason: "technical_trouble",
    explanation:
      "Aplikasi gagal mengunggah swafoto karena sinyal di lokasi kegiatan.",
  },
  {
    reason: "campus_duty",
    explanation: "Mewakili kampus pada lomba debat anggaran di Jakarta.",
  },
  {
    reason: "sick",
    explanation:
      "Demam sejak malam sebelum kegiatan dan beristirahat di kamar.",
  },
  {
    reason: "present_not_recorded",
    explanation:
      "Hadir sampai kegiatan selesai, tetapi foto tidak terkirim sebelum masa unggah ditutup.",
  },
  {
    reason: "family_matter",
    explanation: "Mendampingi orang tua yang dirawat di rumah sakit.",
  },
  {
    reason: "other",
    explanation: "Terlambat tiba karena banjir di jalan menuju kampus.",
  },
];

const NOTES: Record<Exclude<Outcome, "not_asked">, string> = {
  submitted: "",
  rejected: "Lampiran tidak menunjukkan tanggal kegiatan.",
  valid: "",
  dispensation: "Surat keterangan sesuai dengan tanggal kegiatan.",
};

function turnAt(turns: Outcome[], place: number): Outcome {
  return turns[place % turns.length] ?? "not_asked";
}

type StatusByNim = Map<string, AttendanceStatus>;

function statusesBySchedule(
  attendances: SampleActivityAttendance[],
): Map<SampleActivitySchedule, StatusByNim> {
  const bySchedule = new Map<SampleActivitySchedule, StatusByNim>();
  for (const { schedule, nim, status } of attendances) {
    const byNim = bySchedule.get(schedule) ?? new Map();
    byNim.set(nim, status);
    bySchedule.set(schedule, byNim);
  }
  return bySchedule;
}

/** The day after the last upload day: the first day a student is absent. */
function firstAbsentDay(schedule: SampleActivitySchedule): string {
  return daysAfter(uploadDeadline(schedule), 1);
}

function clarificationOf(
  nim: string,
  schedule: SampleActivitySchedule,
  outcome: Exclude<Outcome, "not_asked">,
  place: number,
): SampleClarification {
  const request = REQUESTS[place % REQUESTS.length] ?? REQUESTS[0];
  if (request === undefined) throw new Error("There are no sample requests.");
  // Sent and decided on a day before today, so never ahead of the clock.
  const day = firstAbsentDay(schedule);
  const isAccepted = outcome === "valid" || outcome === "dispensation";
  return {
    nim,
    schedule,
    ...request,
    status: isAccepted ? "accepted" : outcome,
    acceptedAs: isAccepted ? outcome : null,
    note: NOTES[outcome],
    sentAt: campusMoment(day, "10:00"),
    decidedAt: outcome === "submitted" ? null : campusMoment(day, "15:00"),
  };
}

/**
 * The made-up clarifications of the Aktif sample students, for the
 * schedules where they were absent or their photo was rejected, and whose
 * upload time closed before yesterday. The students of one angkatan take
 * turns, so every status is there: waiting and rejected ones where a
 * clarification can still be sent, and decided ones where that time is
 * over. `attendances` is the sample attendance of the same day.
 */
export function sampleClarifications(
  schedules: SampleActivitySchedule[],
  students: SampleStudent[],
  attendances: SampleActivityAttendance[],
  day: string,
): SampleClarification[] {
  const statuses = statusesBySchedule(attendances);
  const clarifications: SampleClarification[] = [];
  for (const { student, place } of activeByCohortPlace(students)) {
    let open = 0;
    let closed = 0;
    for (const schedule of begunFor(schedules, student, day)) {
      if (firstAbsentDay(schedule) >= day) continue;
      const status = statuses.get(schedule)?.get(student.nim) ?? null;
      if (status !== null && status !== "rejected") continue;
      const isOpen = takesClarifications(schedule, day);
      const outcome = isOpen
        ? turnAt(WHILE_OPEN, place + open)
        : turnAt(AFTER_CLOSING, place + closed);
      if (isOpen) open += 1;
      else closed += 1;
      if (outcome === "not_asked") continue;
      clarifications.push(
        clarificationOf(student.nim, schedule, outcome, clarifications.length),
      );
    }
  }
  return clarifications;
}
