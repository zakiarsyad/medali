import { isDay } from "@/db/is-day";
import type { Parsed } from "@/parsed";
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_PATTERNS,
  type ActivityCategory,
  type ActivityPattern,
  AUDIENCES,
  type Audience,
  LAST_MONTH_DAY,
  ONE_OFF,
  ORGANISERS,
  type Organiser,
  type RundownLine,
} from "./activity-ids";
import {
  DAYS_OFF_MAX,
  LOCATION_MAX_LENGTH,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  ORGANISER_NAME_MAX_LENGTH,
  RUNDOWN_ACTIVITY_MAX_LENGTH,
  RUNDOWN_MAX_LINES,
  RUNDOWN_TIME_MAX_LENGTH,
} from "./activity-limits";

/** An activity form as the browser sends it: nothing in it is trusted. */
export interface SentActivity {
  name: string;
  category: string;
  location: string;
  pattern: string;
  weekdays: string[];
  monthDay: string;
  /** Berlaku mulai of a repeating activity. */
  startsOn: string;
  /** Berlaku sampai of a repeating activity; empty for none. */
  endsOn: string;
  /** Tanggal of a one-off activity. */
  day: string;
  startTime: string;
  endTime: string;
  organiser: string;
  organiserName: string;
  audience: string;
  isRequired: boolean;
  daysOff: string[];
  rundownTimes: string[];
  rundownActivities: string[];
}

/** When an activity takes place, as its version keeps it. */
interface Days {
  pattern: ActivityPattern;
  weekdays: number[];
  monthDay: number | null;
  startsOn: string;
  endsOn: string | null;
  daysOff: string[];
}

/** A checked activity, ready to keep. */
export interface ActivityInput extends Days {
  name: string;
  category: ActivityCategory;
  location: string;
  startTime: string;
  endTime: string;
  organiser: Organiser;
  organiserName: string;
  audience: Audience;
  isRequired: boolean;
  rundown: RundownLine[];
}

const HOUR_AND_MINUTE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const WEEKDAY = /^[0-6]$/;
const MONTH_DAY = /^\d{1,2}$/;

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function oneOf<T extends string>(
  known: readonly T[],
  sent: string,
): T | undefined {
  return known.find((value) => value === sent);
}

function parseName(sent: string): Parsed<string> {
  const name = sent.trim();
  if (name.length < NAME_MIN_LENGTH) {
    return refused(`Nama kegiatan paling sedikit ${NAME_MIN_LENGTH} huruf.`);
  }
  if (name.length > NAME_MAX_LENGTH) {
    return refused(`Nama kegiatan paling banyak ${NAME_MAX_LENGTH} karakter.`);
  }
  return { ok: true, value: name };
}

function parseText(sent: string, max: number, what: string): Parsed<string> {
  const typed = sent.trim();
  if (typed.length > max)
    return refused(`${what} paling banyak ${max} karakter.`);
  return { ok: true, value: typed };
}

function parseWeekdays(sent: string[]): Parsed<number[]> {
  if (!sent.every((weekday) => WEEKDAY.test(weekday))) {
    return refused("Pilih hari dari daftar.");
  }
  const weekdays = [...new Set(sent.map(Number))].sort((a, b) => a - b);
  if (weekdays.length === 0) {
    return refused("Pilih minimal satu hari untuk pola mingguan.");
  }
  return { ok: true, value: weekdays };
}

function parseMonthDay(sent: string): Parsed<number> {
  const typed = sent.trim();
  const monthDay = Number(typed);
  if (!MONTH_DAY.test(typed) || monthDay < 1 || monthDay > LAST_MONTH_DAY) {
    return refused(`Tanggal setiap bulan harus 1 sampai ${LAST_MONTH_DAY}.`);
  }
  return { ok: true, value: monthDay };
}

function parseDaysOff(sent: string[]): Parsed<string[]> {
  if (!sent.every(isDay)) {
    return refused(
      "Hari tanpa kegiatan berisi tanggal yang tidak benar. Muat ulang halaman.",
    );
  }
  const daysOff = [...new Set(sent)].sort();
  if (daysOff.length > DAYS_OFF_MAX) {
    return refused(
      `Hari tanpa kegiatan paling banyak ${DAYS_OFF_MAX} tanggal.`,
    );
  }
  return { ok: true, value: daysOff };
}

function parseOneOffDays(sent: SentActivity): Parsed<Days> {
  if (!isDay(sent.day)) {
    return refused("Isi tanggal kegiatan dengan tanggal yang benar.");
  }
  return {
    ok: true,
    value: {
      pattern: ONE_OFF,
      weekdays: [],
      monthDay: null,
      startsOn: sent.day,
      endsOn: sent.day,
      daysOff: [],
    },
  };
}

interface Validity {
  startsOn: string;
  endsOn: string | null;
}

function parseValidity(sent: SentActivity): Parsed<Validity> {
  if (!isDay(sent.startsOn)) {
    return refused("Isi Berlaku mulai dengan tanggal yang benar.");
  }
  if (sent.endsOn === "") {
    return { ok: true, value: { startsOn: sent.startsOn, endsOn: null } };
  }
  if (!isDay(sent.endsOn)) {
    return refused(
      "Isi Berlaku sampai dengan tanggal yang benar, atau kosongkan.",
    );
  }
  if (sent.endsOn < sent.startsOn) {
    return refused("Berlaku sampai harus sama atau setelah Berlaku mulai.");
  }
  return { ok: true, value: { startsOn: sent.startsOn, endsOn: sent.endsOn } };
}

interface Repeat {
  weekdays: number[];
  monthDay: number | null;
}

function parseRepeat(
  pattern: ActivityPattern,
  sent: SentActivity,
): Parsed<Repeat> {
  if (pattern === "weekly") {
    const weekdays = parseWeekdays(sent.weekdays);
    if (!weekdays.ok) return weekdays;
    return { ok: true, value: { weekdays: weekdays.value, monthDay: null } };
  }
  if (pattern === "monthly") {
    const monthDay = parseMonthDay(sent.monthDay);
    if (!monthDay.ok) return monthDay;
    return { ok: true, value: { weekdays: [], monthDay: monthDay.value } };
  }
  return { ok: true, value: { weekdays: [], monthDay: null } };
}

function parseRoutineDays(
  pattern: ActivityPattern,
  sent: SentActivity,
): Parsed<Days> {
  const repeat = parseRepeat(pattern, sent);
  if (!repeat.ok) return repeat;
  const validity = parseValidity(sent);
  if (!validity.ok) return validity;
  const daysOff = parseDaysOff(sent.daysOff);
  if (!daysOff.ok) return daysOff;
  return {
    ok: true,
    value: {
      pattern,
      ...repeat.value,
      ...validity.value,
      daysOff: daysOff.value,
    },
  };
}

function parseDays(sent: SentActivity): Parsed<Days> {
  const pattern = oneOf(ACTIVITY_PATTERNS, sent.pattern);
  if (!pattern) return refused("Pilih pola pengulangan.");
  if (pattern === ONE_OFF) return parseOneOffDays(sent);
  return parseRoutineDays(pattern, sent);
}

interface Hours {
  startTime: string;
  endTime: string;
}

function parseHours(sent: Hours): Parsed<Hours> {
  if (!HOUR_AND_MINUTE.test(sent.startTime)) {
    return refused("Isi jam mulai, misalnya 16:00.");
  }
  if (!HOUR_AND_MINUTE.test(sent.endTime)) {
    return refused("Isi jam selesai, misalnya 17:30.");
  }
  if (sent.endTime <= sent.startTime) {
    return refused("Jam selesai harus setelah jam mulai.");
  }
  return { ok: true, value: sent };
}

function parseLine(time: string, activity: string): Parsed<RundownLine> {
  const line = { time: time.trim(), activity: activity.trim() };
  if (line.time.length > RUNDOWN_TIME_MAX_LENGTH) {
    return refused(
      `Jam di rincian kegiatan paling banyak ${RUNDOWN_TIME_MAX_LENGTH} karakter.`,
    );
  }
  if (line.activity.length > RUNDOWN_ACTIVITY_MAX_LENGTH) {
    return refused(
      `Aktivitas di rincian kegiatan paling banyak ${RUNDOWN_ACTIVITY_MAX_LENGTH} karakter.`,
    );
  }
  return { ok: true, value: line };
}

/** The lines of Rincian kegiatan. A line without an activity is left out. */
function parseRundown(
  times: string[],
  activities: string[],
): Parsed<RundownLine[]> {
  if (times.length !== activities.length) {
    return refused("Rincian kegiatan tidak lengkap. Muat ulang halaman.");
  }
  const lines: RundownLine[] = [];
  for (const [place, time = ""] of times.entries()) {
    const line = parseLine(time, activities[place] ?? "");
    if (!line.ok) return line;
    if (line.value.activity !== "") lines.push(line.value);
  }
  if (lines.length > RUNDOWN_MAX_LINES) {
    return refused(
      `Rincian kegiatan paling banyak ${RUNDOWN_MAX_LINES} baris.`,
    );
  }
  return { ok: true, value: lines };
}

interface People {
  organiser: Organiser;
  organiserName: string;
  audience: Audience;
}

function parsePeople(sent: SentActivity): Parsed<People> {
  const organiser = oneOf(ORGANISERS, sent.organiser);
  if (!organiser) return refused("Pilih penanggung jawab.");
  const organiserName = parseText(
    sent.organiserName,
    ORGANISER_NAME_MAX_LENGTH,
    "Nama penanggung jawab",
  );
  if (!organiserName.ok) return organiserName;
  const audience = oneOf(AUDIENCES, sent.audience);
  if (!audience) return refused("Pilih peserta.");
  return {
    ok: true,
    value: { organiser, organiserName: organiserName.value, audience },
  };
}

/**
 * Checks an activity as sent: a name of 3 letters or more, a Kategori
 * and a pattern from the lists, real days in order (a weekly one on at
 * least one day), an end hour after the start hour, a penanggung jawab
 * and Peserta from the lists, and nothing longer than its limit. A one-off
 * activity keeps its Tanggal as both its first and last day.
 */
export function parseActivity(sent: SentActivity): Parsed<ActivityInput> {
  const name = parseName(sent.name);
  if (!name.ok) return name;
  const category = oneOf(ACTIVITY_CATEGORIES, sent.category);
  if (!category) return refused("Pilih kategori kegiatan.");
  const location = parseText(sent.location, LOCATION_MAX_LENGTH, "Lokasi");
  if (!location.ok) return location;
  const days = parseDays(sent);
  if (!days.ok) return days;
  const hours = parseHours({
    startTime: sent.startTime,
    endTime: sent.endTime,
  });
  if (!hours.ok) return hours;
  const people = parsePeople(sent);
  if (!people.ok) return people;
  const rundown = parseRundown(sent.rundownTimes, sent.rundownActivities);
  if (!rundown.ok) return rundown;

  return {
    ok: true,
    value: {
      name: name.value,
      category,
      location: location.value,
      ...days.value,
      ...hours.value,
      ...people.value,
      isRequired: sent.isRequired,
      rundown: rundown.value,
    },
  };
}
