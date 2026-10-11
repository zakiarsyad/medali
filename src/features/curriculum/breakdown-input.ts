import type { Parsed } from "@/parsed";
import { MEDALI_VALUES, type ValueKey } from "@/ui/medali-values";
import { type Breakdown, codesOf } from "./stage-breakdown";

/** The limits the breakdown form holds to, in the browser and on the server. */
export const TEXT_MAX_LENGTH = 500;
export const ACTIVITY_MAX_LENGTH = 100;
export const ACTIVITIES_MAX = 20;

const TAHAP = /^[1-4]$/;

/** A breakdown form as the browser sends it: nothing in it is trusted. */
export interface SentBreakdown {
  tahap: string;
  valueKey: string;
  text: string;
  activities: string[];
  indicatorCodes: string[];
}

/** A checked breakdown of one nilai at one tahap, ready to keep. */
export interface BreakdownInput extends Breakdown {
  tahap: number;
  valueKey: ValueKey;
}

function refused(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function parseValueKey(sent: string): Parsed<ValueKey> {
  const value = MEDALI_VALUES.find(({ key }) => key === sent);
  if (!value) return refused("Nilai MEDALI tidak dikenal.");
  return { ok: true, value: value.key };
}

function parseIndicatorCodes(sent: string[], key: ValueKey): Parsed<string[]> {
  if (sent.length === 0) return refused("Pilih minimal satu indikator tahap.");
  const codes = codesOf(key);
  if (sent.some((code) => !codes.includes(code))) {
    return refused("Indikator tahap harus dari indikator utama nilai ini.");
  }
  return { ok: true, value: codes.filter((code) => sent.includes(code)) };
}

function parseText(sent: string): Parsed<string> {
  const text = sent.trim();
  if (text.length > TEXT_MAX_LENGTH) {
    return refused(
      `Penjabaran tugas paling banyak ${TEXT_MAX_LENGTH} karakter.`,
    );
  }
  return { ok: true, value: text };
}

function parseActivities(sent: string[]): Parsed<string[]> {
  const filled = sent.map((row) => row.trim()).filter((row) => row !== "");
  const activities = [...new Set(filled)];
  if (activities.length > ACTIVITIES_MAX) {
    return refused(`Kegiatan acuan paling banyak ${ACTIVITIES_MAX} baris.`);
  }
  if (activities.some((row) => row.length > ACTIVITY_MAX_LENGTH)) {
    return refused(
      `Kegiatan acuan paling banyak ${ACTIVITY_MAX_LENGTH} karakter.`,
    );
  }
  return { ok: true, value: activities };
}

/**
 * Checks the breakdown of one nilai at one tahap as sent. At least one
 * indicator must be ticked, and each must be a main indicator of the nilai.
 * Empty kegiatan acuan rows are dropped.
 */
export function parseBreakdown(sent: SentBreakdown): Parsed<BreakdownInput> {
  if (!TAHAP.test(sent.tahap)) return refused("Tahap harus 1 sampai 4.");
  const valueKey = parseValueKey(sent.valueKey);
  if (!valueKey.ok) return valueKey;
  const indicatorCodes = parseIndicatorCodes(
    sent.indicatorCodes,
    valueKey.value,
  );
  if (!indicatorCodes.ok) return indicatorCodes;
  const text = parseText(sent.text);
  if (!text.ok) return text;
  const activities = parseActivities(sent.activities);
  if (!activities.ok) return activities;

  return {
    ok: true,
    value: {
      tahap: Number(sent.tahap),
      valueKey: valueKey.value,
      text: text.value,
      activities: activities.value,
      indicatorCodes: indicatorCodes.value,
    },
  };
}
