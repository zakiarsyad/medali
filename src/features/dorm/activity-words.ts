import { DORM_IDS, DORM_NAMES } from "@/dorms/dorms";
import { shownDay } from "@/ui/day";
import type {
  ActivityCategory,
  ActivityPattern,
  Audience,
  Organiser,
  RoutinePattern,
} from "./activity-ids";

/*
 * How the screens name what a dorm activity holds. Read in the browser
 * too, so nothing here may take from the database code.
 */

export const CATEGORY_WORDS: Record<ActivityCategory, string> = {
  roll_call: "Apel",
  worship: "Ibadah",
  sport: "Olahraga",
  cleaning: "Kebersihan",
  character_building: "Pembinaan karakter",
  study_together: "Belajar bersama",
  arts_and_culture: "Kesenian dan budaya",
  other: "Lainnya",
};

export const PATTERN_WORDS: Record<RoutinePattern, string> = {
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
};

/** The days of the week, by their number: 0 is Minggu. */
export const WEEKDAY_WORDS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

/** The short name of a penanggung jawab, as a badge shows it. */
export const ORGANISER_WORDS: Record<Organiser, string> = {
  upk: "UPK",
  coach: "Pelatih",
  bam: "BAM",
};

/** The full name of a penanggung jawab, as the form and Rincian show it. */
export const ORGANISER_NAMES: Record<Organiser, string> = {
  upk: "Unit Pembangunan Karakter",
  coach: "Pelatih",
  bam: "Badan Asrama Mahasiswa",
};

function isDorm(audience: Audience): audience is (typeof DORM_IDS)[number] {
  return DORM_IDS.some((dorm) => dorm === audience);
}

/** Who takes part, as the screens say it. */
export function audienceWords(audience: Audience): string {
  if (isDorm(audience)) return DORM_NAMES[audience];
  if (audience === "men") return "Penghuni putra";
  if (audience === "women") return "Penghuni putri";
  return "Semua penghuni";
}

/** What a pattern repeats on. */
export interface Repeat {
  pattern: ActivityPattern;
  weekdays: number[];
  monthDay: number | null;
}

/**
 * When an activity repeats, in words: "Setiap hari", "Setiap Rabu, Sabtu"
 * or "Setiap tanggal 1". A one-off activity repeats on nothing.
 */
export function repeatWords(repeat: Repeat): string {
  if (repeat.pattern === "daily") return "Setiap hari";
  if (repeat.pattern === "weekly") {
    const days = repeat.weekdays.map((weekday) => WEEKDAY_WORDS[weekday]);
    return `Setiap ${days.join(", ")}`;
  }
  if (repeat.pattern === "monthly") return `Setiap tanggal ${repeat.monthDay}`;
  return "";
}

/** A place as a list shows it: a line for an activity without one. */
export function placeWords(location: string): string {
  return location === "" ? "-" : location;
}

/** The penanggung jawab in full, with the name of the person or team. */
export function organiserLine(
  organiser: Organiser,
  organiserName: string,
): string {
  const full = ORGANISER_NAMES[organiser];
  return organiserName === "" ? full : `${full} · ${organiserName}`;
}

/** The hours of an activity, such as 05:30–06:15. */
export function hoursWords(startTime: string, endTime: string): string {
  return `${startTime}–${endTime}`;
}

/** Berlaku: from its first day to its last, or "seterusnya" without one. */
export function validityWords(startsOn: string, endsOn: string | null): string {
  const until = endsOn === null ? "seterusnya" : shownDay(endsOn);
  return `${shownDay(startsOn)} – ${until}`;
}

/** A day with its day of the week, such as Rabu, 14 Okt 2026. */
export function dayWords(day: string): string {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
  return `${WEEKDAY_WORDS[weekday]}, ${shownDay(day)}`;
}
