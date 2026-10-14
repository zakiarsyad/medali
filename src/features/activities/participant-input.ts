import { isUuid } from "@/db/is-uuid";
import type { Parsed } from "@/parsed";
import type { ParticipantChoice } from "./chosen-participants";

/*
 * The Peserta part of the form of an extra activity, as the browser sends
 * it. Read by the form in the browser too: nothing here may take from the
 * database code.
 */

/** Per mahasiswa, Per kelas, Per angkatan or Lintas angkatan, in that order. */
export const PARTICIPANT_MODES = [
  "students",
  "classes",
  "cohort",
  "cohorts",
] as const;

export type ParticipantMode = (typeof PARTICIPANT_MODES)[number];

export const PARTICIPANT_MODE_WORDS: Record<ParticipantMode, string> = {
  students: "Per mahasiswa",
  classes: "Per kelas",
  cohort: "Per angkatan",
  cohorts: "Lintas angkatan",
};

/** The most students, classes or angkatan one schedule names. */
export const PARTICIPANT_RULES_MAX = 2000;

/** The longest class name the form takes. */
export const CLASS_NAME_MAX_LENGTH = 50;

/** The Peserta part as sent: nothing in it is trusted. */
export interface SentParticipants {
  mode: string;
  /** The keys of the students, the class names, or the angkatan years. */
  values: string[];
}

export const NO_PARTICIPANTS = {
  ok: false,
  error: "Tentukan peserta kegiatan.",
} as const;

export const TOO_FEW_COHORTS = {
  ok: false,
  error: "Pilih dua angkatan atau lebih.",
} as const;

export const ONE_COHORT = {
  ok: false,
  error: "Pilih satu angkatan, atau pilih Lintas angkatan.",
} as const;

export const TOO_MANY_PARTICIPANTS = {
  ok: false,
  error: `Peserta paling banyak ${PARTICIPANT_RULES_MAX.toLocaleString("id-ID")} pilihan.`,
} as const;

/** Said of a pick no form offers, or of a student who is not stored. */
export const UNKNOWN_PARTICIPANTS = {
  ok: false,
  error:
    "Peserta yang dipilih tidak dikenali. Muat ulang halaman, lalu pilih peserta lagi.",
} as const;

const YEAR = /^\d{4}$/;

function isMode(sent: string): sent is ParticipantMode {
  return Object.keys(PARTICIPANT_MODE_WORDS).includes(sent);
}

function isClassName(value: string): boolean {
  return value.length <= CLASS_NAME_MAX_LENGTH;
}

/** The values as sent, trimmed, without blanks and without repeats. */
function distinct(values: readonly string[]): string[] {
  const kept = values.map((value) => value.trim()).filter((value) => value);
  return [...new Set(kept)];
}

function parseCohorts(
  mode: "cohort" | "cohorts",
  values: string[],
): Parsed<ParticipantChoice> {
  if (!values.every((value) => YEAR.test(value))) return UNKNOWN_PARTICIPANTS;
  if (mode === "cohort" && values.length > 1) return ONE_COHORT;
  if (mode === "cohorts" && values.length < 2) return TOO_FEW_COHORTS;
  const cohortYears = values.map(Number).sort((one, other) => one - other);
  return { ok: true, value: { kind: "cohorts", cohortYears } };
}

/**
 * Checks the Peserta part as sent: a known kind of choice, at least one
 * pick, and every pick of the right shape. Per angkatan takes one
 * angkatan and Lintas angkatan two or more. Classes come back by name and
 * angkatan from the earliest, as Sasaran lists them. Whether the picks are stored
 * and hold an Aktif student is for the database to say.
 */
export function parseParticipants(
  sent: SentParticipants,
): Parsed<ParticipantChoice> {
  const values = distinct(sent.values);
  if (!isMode(sent.mode) || values.length === 0) return NO_PARTICIPANTS;
  if (values.length > PARTICIPANT_RULES_MAX) return TOO_MANY_PARTICIPANTS;
  switch (sent.mode) {
    case "students":
      if (!values.every(isUuid)) return UNKNOWN_PARTICIPANTS;
      return { ok: true, value: { kind: "students", studentIds: values } };
    case "classes":
      if (!values.every(isClassName)) return UNKNOWN_PARTICIPANTS;
      return {
        ok: true,
        value: { kind: "classes", classNames: values.sort() },
      };
    case "cohort":
    case "cohorts":
      return parseCohorts(sent.mode, values);
  }
}
