import type { Parsed } from "@/parsed";
import { type AssignmentMethod, methodOf } from "./methods";
import { NOT_UNDERSTOOD } from "./refusals";
import { clampTargetSize } from "./target-size";

/** "Bentuk kelompok" as the form sends it. */
export interface SentForming {
  cohortYear: string;
  targetSize: string;
  method: string;
  version: string;
}

export interface Forming {
  cohortYear: number;
  targetSize: number;
  method: AssignmentMethod;
  /** The version of the draft the form was shown with, or 0 for none. */
  version: number;
}

const YEAR = /^\d{4}$/;
/** Short enough to fit the number the database keeps for a version. */
const VERSION = /^\d{1,9}$/;

/** The angkatan a form names, or null for a text that names none. */
export function cohortYearOf(sent: string): number | null {
  return YEAR.test(sent) ? Number(sent) : null;
}

/** The version a form names, or null for a text that names none. */
export function versionOf(sent: string): number | null {
  return VERSION.test(sent) ? Number(sent) : null;
}

/**
 * Checks "Bentuk kelompok" as sent. A target size outside 25 to 35 is
 * brought into it, and an empty one is the starting size.
 */
export function parseForming(sent: SentForming): Parsed<Forming> {
  const cohortYear = cohortYearOf(sent.cohortYear);
  const version = versionOf(sent.version);
  if (cohortYear === null || version === null) return NOT_UNDERSTOOD;
  const method = methodOf(sent.method);
  if (method === null) return { ok: false, error: "Pilih metode pembagian." };
  const targetSize = clampTargetSize(Number(sent.targetSize));
  return { ok: true, value: { cohortYear, targetSize, method, version } };
}
