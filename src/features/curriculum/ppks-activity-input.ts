import type { Parsed } from "@/parsed";
import { MEDALI_VALUES, type ValueKey } from "@/ui/medali-values";
import { mainIndicators } from "./main-indicators";

/** The lengths the activity form holds to, in the browser and on the server. */
export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;

const SEMESTER = /^[1-8]$/;
const TARGET = /^\d{1,6}$/;

/** An activity form as the browser sends it: nothing in it is trusted. */
export interface SentPpksActivity {
  semester: string;
  name: string;
  valueKeys: string[];
  indicatorCodes: string[];
  target: string;
  isRequired: boolean;
  description: string;
}

/** A checked activity, ready to keep. */
export interface PpksActivityInput {
  semester: number;
  name: string;
  valueKeys: ValueKey[];
  indicatorCodes: string[];
  targetParticipants: number | null;
  isRequired: boolean;
  description: string;
}

const VALUE_KEYS: readonly string[] = MEDALI_VALUES.map((value) => value.key);
const INDICATOR_CODES = mainIndicators(new Map()).flatMap((value) =>
  value.indicators.map((indicator) => indicator.code),
);

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function parseName(sent: string): Parsed<string> {
  const name = sent.trim();
  if (name.length < NAME_MIN_LENGTH) return refused("Isi nama kegiatan.");
  if (name.length > NAME_MAX_LENGTH) {
    return refused(`Nama kegiatan paling banyak ${NAME_MAX_LENGTH} karakter.`);
  }
  return { ok: true, value: name };
}

function parseValueKeys(sent: string[]): Parsed<ValueKey[]> {
  if (sent.length === 0) return refused("Pilih minimal satu nilai MEDALI.");
  if (sent.some((key) => !VALUE_KEYS.includes(key))) {
    return refused("Nilai MEDALI tidak dikenal.");
  }
  const keys = MEDALI_VALUES.map((value) => value.key);
  return { ok: true, value: keys.filter((key) => sent.includes(key)) };
}

function parseIndicatorCodes(
  sent: string[],
  valueKeys: readonly string[],
): Parsed<string[]> {
  if (sent.length === 0) return refused("Pilih minimal satu indikator utama.");
  if (sent.some((code) => !INDICATOR_CODES.includes(code))) {
    return refused("Indikator utama tidak dikenal.");
  }
  if (sent.some((code) => !valueKeys.includes(code.charAt(0)))) {
    return refused("Indikator utama harus dari nilai MEDALI yang dipilih.");
  }
  const codes = INDICATOR_CODES.filter((code) => sent.includes(code));
  return { ok: true, value: codes };
}

function parseSemester(sent: string): Parsed<number> {
  if (!SEMESTER.test(sent)) return refused("Semester harus 1 sampai 8.");
  return { ok: true, value: Number(sent) };
}

function parseTarget(sent: string): Parsed<number | null> {
  const typed = sent.trim();
  if (typed === "") return { ok: true, value: null };
  if (!TARGET.test(typed)) {
    return refused("Target peserta harus bilangan bulat dari 0 sampai 999999.");
  }
  return { ok: true, value: Number(typed) };
}

function parseDescription(sent: string): Parsed<string> {
  const description = sent.trim();
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    return refused(
      `Deskripsi paling banyak ${DESCRIPTION_MAX_LENGTH} karakter.`,
    );
  }
  return { ok: true, value: description };
}

/**
 * Checks a PPKS activity as sent. Every indicator must be a main indicator
 * of a chosen nilai.
 */
export function parsePpksActivity(
  sent: SentPpksActivity,
): Parsed<PpksActivityInput> {
  const name = parseName(sent.name);
  if (!name.ok) return name;
  const valueKeys = parseValueKeys(sent.valueKeys);
  if (!valueKeys.ok) return valueKeys;
  const indicatorCodes = parseIndicatorCodes(
    sent.indicatorCodes,
    valueKeys.value,
  );
  if (!indicatorCodes.ok) return indicatorCodes;
  const semester = parseSemester(sent.semester);
  if (!semester.ok) return semester;
  const target = parseTarget(sent.target);
  if (!target.ok) return target;
  const description = parseDescription(sent.description);
  if (!description.ok) return description;

  return {
    ok: true,
    value: {
      semester: semester.value,
      name: name.value,
      valueKeys: valueKeys.value,
      indicatorCodes: indicatorCodes.value,
      targetParticipants: target.value,
      isRequired: sent.isRequired,
      description: description.value,
    },
  };
}
