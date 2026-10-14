import { daysAfter } from "@/academic-periods/days-after";
import type {
  LeaveKind,
  LeaveStatus,
  SpecialReason,
} from "@/features/dorm/leave-ids";

/*
 * Made-up leave requests only, of the made-up residents.
 */

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
}

/** How many sample residents the requests are spread over. */
export const SAMPLE_LEAVE_RESIDENTS = 9;

const CONTACT = "0812-0000-0000 (orang tua)";

function at(day: string, daysFrom: number, time: string): string {
  return `${daysAfter(day, daysFrom)}T${time}`;
}

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
  };
}

/**
 * The made-up requests around a day, in every status: three approved
 * before the day, whose time covers sample dorm activities of the week
 * the sample counts are of (an Izin pesiar and an Izin khusus over two
 * days, which show as Izin, and an ITMK, which shows as Hadir with ITMK),
 * one rejected and one cancelled, three waiting after the day, one
 * waiting whose start has passed, and one approved after the day.
 * `day` is today on campus.
 */
export function sampleDormLeaves(day: string): SampleLeave[] {
  return [
    outing(0, day, -3, ["13:00", "20:00"], "approved"),
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
      status: "approved",
      decisionNote: "",
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
    },
    outing(8, day, -1, ["08:00", "12:00"], "submitted"),
    outing(0, day, 2, ["10:00", "17:00"], "approved"),
  ];
}
