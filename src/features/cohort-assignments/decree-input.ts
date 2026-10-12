import { isDay } from "@/db/is-day";
import type { Parsed } from "@/parsed";
import {
  type DraftKey,
  parseDraftKey,
  type SentDraftKey,
} from "./draft-change-input";

/** What "4. Penetapan" can be sent for: its three buttons. */
export const DECREE_STEPS = ["save", "submit", "fix"] as const;

export type DecreeStep = (typeof DECREE_STEPS)[number];

/** The step a form names, or null for a text that names none. */
export function decreeStepOf(sent: string): DecreeStep | null {
  return DECREE_STEPS.find((step) => step === sent) ?? null;
}

/** "4. Penetapan" as the form sends it. */
export interface SentDecree extends SentDraftKey {
  decreeNumber: string;
  effectiveOn: string;
}

/** "Nomor surat keputusan" and "Berlaku mulai", each null while not filled. */
export interface Decree {
  decreeNumber: string | null;
  effectiveOn: string | null;
}

export interface DecreeInput extends DraftKey, Decree {}

export const DECREE_NUMBER_MAX = 100;
const FIRST_DAY = "2000-01-01";
const LAST_DAY = "2101-12-31";

const NUMBER_TOO_LONG = {
  ok: false,
  error: `Nomor surat keputusan paling panjang ${DECREE_NUMBER_MAX} karakter.`,
} as const;

const DAY_REFUSED = {
  ok: false,
  error: "Isi Berlaku mulai dengan tanggal di antara tahun 2000 dan 2101.",
} as const;

function isDayInRange(sent: string): boolean {
  return isDay(sent) && sent >= FIRST_DAY && sent <= LAST_DAY;
}

/**
 * Checks "4. Penetapan" as sent. Both fields may be left empty while the
 * draft is prepared: only the penetapan itself asks for them.
 */
export function parseDecree(sent: SentDecree): Parsed<DecreeInput> {
  const key = parseDraftKey(sent);
  if (!key.ok) return key;
  const decreeNumber = sent.decreeNumber.trim();
  if (decreeNumber.length > DECREE_NUMBER_MAX) return NUMBER_TOO_LONG;
  const effectiveOn = sent.effectiveOn;
  if (effectiveOn !== "" && !isDayInRange(effectiveOn)) return DAY_REFUSED;
  return {
    ok: true,
    value: {
      ...key.value,
      decreeNumber: decreeNumber === "" ? null : decreeNumber,
      effectiveOn: effectiveOn === "" ? null : effectiveOn,
    },
  };
}

/** A decree with nothing missing: what "Tetapkan" needs. */
export interface WholeDecree {
  decreeNumber: string;
  effectiveOn: string;
}

export const ASK_FOR_NUMBER = "Isi nomor surat keputusan.";
export const ASK_FOR_DAY = "Isi tanggal Berlaku mulai.";

/**
 * The decree "Tetapkan" needs, or what it asks for while the number or
 * the day is missing. The tab asks with it before it sends, and the
 * server again for what was sent.
 */
export function wholeDecree(decree: Decree): Parsed<WholeDecree> {
  const decreeNumber = decree.decreeNumber?.trim() ?? "";
  if (decreeNumber === "") return { ok: false, error: ASK_FOR_NUMBER };
  const effectiveOn = decree.effectiveOn ?? "";
  if (effectiveOn === "") return { ok: false, error: ASK_FOR_DAY };
  return { ok: true, value: { decreeNumber, effectiveOn } };
}
