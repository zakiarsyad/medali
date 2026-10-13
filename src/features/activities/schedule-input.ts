import { isDay } from "@/db/is-day";
import { isUuid } from "@/db/is-uuid";
import type { Parsed } from "@/parsed";
import {
  UPLOAD_COUNT_MAX,
  UPLOAD_UNIT_WORDS,
  type UploadUnit,
} from "./upload-range";

/** The longest place the form takes, in the browser and on the server. */
export const LOCATION_MAX_LENGTH = 100;

const HOUR_AND_MINUTE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const UPLOAD_COUNT = /^\d{1,2}$/;

/** A schedule form as the browser sends it: nothing in it is trusted. */
export interface SentSchedule {
  activityId: string;
  startsOn: string;
  endsOn: string;
  startTime: string;
  endTime: string;
  uploadCount: string;
  uploadUnit: string;
  location: string;
  isRequired: boolean;
}

/** A checked schedule, ready to keep once its activity is found. */
export interface ScheduleInput {
  activityId: string;
  startsOn: string;
  endsOn: string;
  /** The hour and minute, such as 07:30. */
  startTime: string;
  endTime: string;
  uploadCount: number;
  uploadUnit: UploadUnit;
  location: string;
  isRequired: boolean;
}

/** What is said when no activity of the Kurikulum list is chosen. */
export const NO_ACTIVITY = {
  ok: false,
  error: "Pilih kegiatan dari daftar Kurikulum.",
} as const;

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

interface Days {
  startsOn: string;
  endsOn: string;
}

function parseDays(sent: Days): Parsed<Days> {
  if (!isDay(sent.startsOn)) {
    return refused("Isi tanggal mulai dengan tanggal yang benar.");
  }
  if (!isDay(sent.endsOn)) {
    return refused("Isi tanggal selesai dengan tanggal yang benar.");
  }
  if (sent.endsOn < sent.startsOn) {
    return refused("Tanggal selesai harus sama atau setelah tanggal mulai.");
  }
  return { ok: true, value: sent };
}

interface Hours {
  startTime: string;
  endTime: string;
}

function parseHours(sent: Hours): Parsed<Hours> {
  if (!HOUR_AND_MINUTE.test(sent.startTime)) {
    return refused("Isi jam mulai, misalnya 07:30.");
  }
  if (!HOUR_AND_MINUTE.test(sent.endTime)) {
    return refused("Isi jam selesai, misalnya 11:30.");
  }
  if (sent.endTime <= sent.startTime) {
    return refused("Jam selesai harus setelah jam mulai.");
  }
  return { ok: true, value: sent };
}

function parseUploadCount(sent: string): Parsed<number> {
  const typed = sent.trim();
  const isInRange =
    UPLOAD_COUNT.test(typed) && Number(typed) <= UPLOAD_COUNT_MAX;
  if (!isInRange) {
    return refused(
      `Rentang unggah harus bilangan bulat dari 0 sampai ${UPLOAD_COUNT_MAX}.`,
    );
  }
  return { ok: true, value: Number(typed) };
}

function isUploadUnit(sent: string): sent is UploadUnit {
  return Object.keys(UPLOAD_UNIT_WORDS).includes(sent);
}

function parseUploadUnit(sent: string): Parsed<UploadUnit> {
  if (!isUploadUnit(sent)) {
    return refused("Pilih hari atau minggu untuk rentang unggah.");
  }
  return { ok: true, value: sent };
}

function parseLocation(sent: string): Parsed<string> {
  const location = sent.trim();
  if (location.length > LOCATION_MAX_LENGTH) {
    return refused(`Lokasi paling banyak ${LOCATION_MAX_LENGTH} karakter.`);
  }
  return { ok: true, value: location };
}

/**
 * Checks a schedule as sent: that an activity is named, the days and the
 * hours are real and in order, the upload range is within its limits and
 * the place is not too long. Whether the activity may be scheduled is for
 * the database to say.
 */
export function parseSchedule(sent: SentSchedule): Parsed<ScheduleInput> {
  if (!isUuid(sent.activityId)) return NO_ACTIVITY;
  const days = parseDays(sent);
  if (!days.ok) return days;
  const hours = parseHours(sent);
  if (!hours.ok) return hours;
  const uploadCount = parseUploadCount(sent.uploadCount);
  if (!uploadCount.ok) return uploadCount;
  const uploadUnit = parseUploadUnit(sent.uploadUnit);
  if (!uploadUnit.ok) return uploadUnit;
  const location = parseLocation(sent.location);
  if (!location.ok) return location;

  return {
    ok: true,
    value: {
      activityId: sent.activityId,
      startsOn: days.value.startsOn,
      endsOn: days.value.endsOn,
      startTime: hours.value.startTime,
      endTime: hours.value.endTime,
      uploadCount: uploadCount.value,
      uploadUnit: uploadUnit.value,
      location: location.value,
      isRequired: sent.isRequired,
    },
  };
}
