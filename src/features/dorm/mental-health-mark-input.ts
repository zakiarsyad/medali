/*
 * How a sent "Potensi kesehatan mental" is checked. Read by the form in
 * the browser and by the server, which checks again what is sent, so
 * nothing here may take from the database code.
 */

import type { Parsed } from "@/parsed";
import {
  MARK_CATEGORIES,
  type MarkCategory,
  OBSERVATION_MAX,
} from "./mental-health-mark-ids";
import {
  OBSERVATION_TOO_LONG,
  REFERRAL_NEEDS_OBSERVATION,
  UNKNOWN_MARK,
} from "./mental-health-mark-words";

/** A mark as the form sends it: "Kategori potensi" empty for "Tidak ada indikasi". */
export interface SentMark {
  category: string;
  observation: string;
}

/** A mark the server keeps; no category is "Tidak ada indikasi". */
export interface MarkInput {
  category: MarkCategory | null;
  observation: string;
}

export const NO_MARK: MarkInput = { category: null, observation: "" };

function isMarkCategory(sent: string): sent is MarkCategory {
  return MARK_CATEGORIES.some((category) => category === sent);
}

/**
 * Checks a sent mark: "Kategori potensi" is a choice of the form, the
 * observation fits, and a referral to the counsellor has one. "Tidak ada
 * indikasi" clears the observation with the mark.
 */
export function parseMark(sent: SentMark): Parsed<MarkInput> {
  if (sent.category === "") return { ok: true, value: NO_MARK };
  if (!isMarkCategory(sent.category)) {
    return { ok: false, error: UNKNOWN_MARK };
  }
  const observation = sent.observation.trim();
  if (observation.length > OBSERVATION_MAX) {
    return { ok: false, error: OBSERVATION_TOO_LONG };
  }
  if (sent.category === "refer" && observation === "") {
    return { ok: false, error: REFERRAL_NEEDS_OBSERVATION };
  }
  return { ok: true, value: { category: sent.category, observation } };
}

export function sameMark(one: MarkInput, other: MarkInput): boolean {
  return (
    one.category === other.category && one.observation === other.observation
  );
}
