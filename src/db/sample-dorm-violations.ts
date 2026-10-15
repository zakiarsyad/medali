import { campusDay } from "@/academic-periods/campus-day";
import { daysAfter } from "@/academic-periods/days-after";
import {
  ANNOUNCEMENT_TIME,
  type Punishment,
} from "@/features/dorm/violation-ids";

/*
 * Made-up dorm violations only, of the made-up residents.
 */

/** A sample violation, with the moment it is announced. */
export interface SampleViolation {
  /** Which of the sample residents it is of, by place in their list. */
  resident: number;
  day: string;
  reason: string;
  punishment: Punishment;
  otherPunishment: string;
  announcedAt: Date;
  /** Whether BAM cancelled it before its announcement. */
  isCancelled: boolean;
}

/** How many sample residents the violations are spread over. */
export const SAMPLE_VIOLATION_RESIDENTS = 24;

/** How many days before today hold announced sample violations. */
const PAST_DAYS = 10;

const HOUR_MS = 60 * 60 * 1000;

const REASONS = [
  "Terlambat apel pagi",
  "Tidak mengikuti kegiatan asrama tanpa keterangan",
  "Kamar tidak rapi saat pemeriksaan",
  "Membuat kegaduhan pada jam istirahat",
  "Tidak berpakaian sesuai ketentuan",
];

const PUNISHMENTS: Punishment[] = ["warning", "direct_action", "tks"];

/** A moment on campus, as a day and an hour such as 21:00. */
function campusMoment(day: string, time: string): Date {
  return new Date(`${day}T${time}:00+07:00`);
}

function violation(
  resident: number,
  day: string,
  announcedAt: Date,
  place: number,
): SampleViolation {
  return {
    resident: resident % SAMPLE_VIOLATION_RESIDENTS,
    day,
    reason: REASONS[place % REASONS.length] ?? "Terlambat apel pagi",
    punishment: PUNISHMENTS[place % PUNISHMENTS.length] ?? "warning",
    otherPunishment: "",
    announcedAt,
    isCancelled: false,
  };
}

/**
 * Two violations on each of the days before today, announced at 21:00 of
 * their day, and a third for the first resident on every third day, so
 * that one resident has several. One of them has Hukuman lainnya.
 */
function pastViolations(today: string): SampleViolation[] {
  const past: SampleViolation[] = [];
  for (let back = 1; back <= PAST_DAYS; back++) {
    const day = daysAfter(today, -back);
    const announcedAt = campusMoment(day, ANNOUNCEMENT_TIME);
    past.push(violation(back * 7, day, announcedAt, back));
    past.push(violation(back * 11 + 3, day, announcedAt, back + 1));
    if (back % 3 === 0) past.push(violation(0, day, announcedAt, back + 2));
  }
  const [first] = past;
  if (first) {
    first.punishment = "other";
    first.otherPunishment = "Membersihkan musala asrama";
  }
  return past;
}

/** Three violations announced an hour ago, still in Masa advokasi. */
function appealing(now: Date): SampleViolation[] {
  const announcedAt = new Date(now.getTime() - HOUR_MS);
  const day = campusDay(announcedAt);
  return [0, 5, 9].map((resident, place) =>
    violation(resident, day, announcedAt, place),
  );
}

/**
 * The next 21:00 on campus at least an hour after now: today's, or
 * tomorrow's once today's is too close or has passed.
 */
export function nextAnnouncement(now: Date): Date {
  const today = campusDay(now);
  const tonight = campusMoment(today, ANNOUNCEMENT_TIME);
  if (tonight.getTime() - now.getTime() >= HOUR_MS) return tonight;
  return campusMoment(daysAfter(today, 1), ANNOUNCEMENT_TIME);
}

/** Two violations of today that wait for their announcement, and one cancelled. */
function waiting(now: Date): SampleViolation[] {
  const announcedAt = nextAnnouncement(now);
  const day = campusDay(now);
  const cancelled = violation(3, day, announcedAt, 2);
  cancelled.isCancelled = true;
  return [
    violation(2, day, announcedAt, 0),
    violation(6, day, announcedAt, 1),
    cancelled,
  ];
}

/**
 * The made-up violations around now: announced ones on the days before
 * today, which went up to Pengelola Asrama, three in Masa advokasi, and
 * three of today waiting for their announcement, one of them cancelled.
 */
export function sampleDormViolations(now: Date): SampleViolation[] {
  return [
    ...pastViolations(campusDay(now)),
    ...appealing(now),
    ...waiting(now),
  ];
}
