import { daysAfter } from "@/academic-periods/days-after";
import type {
  LeaveKind,
  LeaveStatus,
  ReportStatus,
  SpecialReason,
} from "@/features/dorm/leave-ids";
import { campusTimeOf } from "@/features/dorm/leave-time";

/*
 * Made-up leave requests only, of the made-up residents.
 */

/** A sample report of a return, its time on campus such as 2026-10-14T19:00. */
export interface SampleReport {
  sentAt: string;
  status: ReportStatus;
  /** What BAM - BPHK noted, empty when nothing was noted. */
  verifyNote: string;
  /** What Pengelola Asrama noted, empty when nothing was noted. */
  validateNote: string;
}

/** A sample leave request, its times on campus such as 2026-10-14T19:00. */
export interface SampleLeave {
  /** Which of the sample residents asked, by place in their list. */
  resident: number;
  kind: LeaveKind;
  startsAt: string;
  endsAt: string;
  specialReason: SpecialReason | null;
  purpose: string;
  destination: string;
  contact: string;
  status: LeaveStatus;
  /** What Pengelola Asrama noted, empty when nothing was noted. */
  decisionNote: string;
  /** When the resident was back, for leave that is Selesai. */
  returnedAt: string | null;
  /** Whether staff recorded the return directly, with no report. */
  recordedDirectly: boolean;
  report: SampleReport | null;
}

/** How many sample residents the requests are spread over. */
export const SAMPLE_LEAVE_RESIDENTS = 14;

const CONTACT = "0812-0000-0000 (orang tua)";
const HOUR_MS = 60 * 60 * 1000;

function at(day: string, daysFrom: number, time: string): string {
  return `${daysAfter(day, daysFrom)}T${time}`;
}

/** The time on campus some hours from a moment, to the minute. */
function hoursFrom(now: Date, hours: number): string {
  return campusTimeOf(new Date(now.getTime() + hours * HOUR_MS));
}

const NOT_BACK = {
  returnedAt: null,
  recordedDirectly: false,
  report: null,
} as const;

function outing(
  resident: number,
  day: string,
  daysFrom: number,
  hours: [string, string],
  status: LeaveStatus,
  decisionNote = "",
): SampleLeave {
  return {
    resident,
    kind: "outing",
    startsAt: at(day, daysFrom, hours[0]),
    endsAt: at(day, daysFrom, hours[1]),
    specialReason: null,
    purpose: "Membeli perlengkapan kuliah",
    destination: "Bintaro",
    contact: CONTACT,
    status,
    decisionNote,
    ...NOT_BACK,
  };
}

function skipping(
  resident: number,
  day: string,
  daysFrom: number,
  status: LeaveStatus,
  decisionNote = "",
): SampleLeave {
  return {
    resident,
    kind: "skip_activities",
    startsAt: at(day, daysFrom, "19:00"),
    endsAt: at(day, daysFrom, "21:30"),
    specialReason: null,
    purpose: "Kuliah pengganti di kampus",
    destination: "",
    contact: "",
    status,
    decisionNote,
    ...NOT_BACK,
  };
}

/**
 * The made-up requests around a day, in every status: three approved
 * before the day, whose time covers sample dorm activities of the week
 * the sample counts are of (an Izin pesiar, back on time with a validated
 * report, and an Izin khusus over two days, back late as recorded by
 * BAM - BPHK, which show as Izin, and an ITMK, which shows as Hadir with
 * ITMK), one rejected and one cancelled, three waiting after the day, one
 * waiting whose start has passed, and one approved after the day. `day`
 * is today on campus.
 */
export function sampleDormLeaves(day: string): SampleLeave[] {
  const pastOuting = outing(0, day, -3, ["13:00", "20:00"], "completed");
  return [
    {
      ...pastOuting,
      returnedAt: pastOuting.endsAt,
      report: {
        sentAt: pastOuting.endsAt,
        status: "validated",
        verifyNote: "",
        validateNote: "",
      },
    },
    skipping(1, day, -2, "approved", "Sertakan jadwal kuliah pengganti."),
    {
      resident: 2,
      kind: "special",
      startsAt: at(day, -5, "15:00"),
      endsAt: at(day, -4, "18:00"),
      specialReason: "family",
      purpose: "Menghadiri pernikahan kakak di Bogor",
      destination: "Bogor",
      contact: CONTACT,
      status: "completed",
      decisionNote: "",
      returnedAt: at(day, -4, "18:20"),
      recordedDirectly: true,
      report: null,
    },
    outing(
      3,
      day,
      -1,
      ["10:00", "16:00"],
      "rejected",
      "Bertepatan dengan kerja bakti asrama.",
    ),
    outing(4, day, 1, ["09:00", "15:00"], "cancelled"),
    outing(5, day, 1, ["09:00", "15:00"], "submitted"),
    skipping(6, day, 2, "submitted"),
    {
      resident: 7,
      kind: "special",
      startsAt: at(day, 3, "16:00"),
      endsAt: at(day, 5, "18:00"),
      specialReason: "competition",
      purpose: "Lomba debat antarperguruan tinggi",
      destination: "Universitas di Depok",
      contact: CONTACT,
      status: "submitted",
      decisionNote: "",
      ...NOT_BACK,
    },
    outing(8, day, -1, ["08:00", "12:00"], "submitted"),
    outing(0, day, 2, ["10:00", "17:00"], "approved"),
  ];
}

/** Approved Izin khusus from and to some hours from a moment. */
function outFor(
  resident: number,
  now: Date,
  hours: [number, number],
  purpose: string,
): SampleLeave {
  return {
    resident,
    kind: "special",
    startsAt: hoursFrom(now, hours[0]),
    endsAt: hoursFrom(now, hours[1]),
    specialReason: "family",
    purpose,
    destination: "Jakarta Selatan",
    contact: CONTACT,
    status: "approved",
    decisionNote: "",
    ...NOT_BACK,
  };
}

/** A report sent some hours from a moment. */
function reportAt(
  now: Date,
  hours: number,
  status: ReportStatus,
  verifyNote = "",
): SampleReport {
  return {
    sentAt: hoursFrom(now, hours),
    status,
    verifyNote,
    validateNote: "",
  };
}

/**
 * The made-up leave of residents who are out at a moment or reported
 * back: a report that waits for BAM - BPHK, on time; one BAM verified,
 * late, that waits for Pengelola Asrama; one BAM rejected, whose resident
 * may send a new photo; leave out past its return time with no report;
 * and leave out whose return time has not come. Izin khusus, so none
 * goes overnight against the rule of Izin pesiar, whatever the hour.
 */
export function sampleReturns(now: Date): SampleLeave[] {
  return [
    {
      ...outFor(9, now, [-6, 1 / 3], "Mengurus berkas beasiswa di bank"),
      report: reportAt(now, -1 / 12, "waiting"),
    },
    {
      ...outFor(10, now, [-8, -1], "Menjenguk saudara di rumah sakit"),
      report: reportAt(now, -2 / 3, "verified"),
    },
    {
      ...outFor(11, now, [-7, 1 / 6], "Mengambil paket kiriman keluarga"),
      report: reportAt(
        now,
        -1 / 4,
        "rejected",
        "Foto tidak menunjukkan asrama. Kirim ulang dari depan gedung asrama.",
      ),
    },
    outFor(12, now, [-9, -1], "Menghadiri acara keluarga"),
    outFor(13, now, [-2, 20], "Urusan keluarga di Tangerang Selatan"),
  ];
}
