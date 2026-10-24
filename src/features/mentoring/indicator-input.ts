/*
 * The fields of the form "Indikator penilaian" and their checks, shared
 * by the form in the browser and the server that reads what it sends.
 */

import {
  INDICATOR_COUNT,
  NAME_MAX,
  type ScoreIndicator,
  SENTENCE_MAX,
} from "@/mentoring/score-indicators";
import type { Parsed } from "@/parsed";
import { text } from "@/ui/form-data";

/** The version of the indicators the form was opened on. */
export const INDICATORS_VERSION_FIELD = "version";

export function nameField(place: number): string {
  return `indicator.${place}.name`;
}

export function sentenceField(place: number): string {
  return `indicator.${place}.sentence`;
}

export const NAME_EMPTY = "Nama indikator wajib diisi.";
export const NAME_TOO_LONG = `Nama indikator paling banyak ${NAME_MAX} karakter.`;
export const NAMES_EQUAL = "Nama indikator tidak boleh sama.";
export const SENTENCE_EMPTY = "Kalimat indikator wajib diisi.";
export const SENTENCE_TOO_LONG = `Kalimat indikator paling banyak ${SENTENCE_MAX} karakter.`;

const NOT_SAVED =
  "Ada indikator yang belum benar, jadi belum ada yang disimpan. Perbaiki yang ditandai, lalu simpan lagi.";

const INCOMPLETE =
  "Formulir ini tidak lengkap. Muat ulang halaman, lalu isi lagi.";

/** What is wrong with the name or the sentence of one indicator, if anything. */
export interface IndicatorFault {
  name?: string;
  sentence?: string;
}

/** The six indicators as the form sent them, each field as text. */
export function sentIndicatorsOf(form: FormData): ScoreIndicator[] {
  const sent: ScoreIndicator[] = [];
  for (let place = 0; place < INDICATOR_COUNT; place++) {
    sent.push({
      name: text(form, nameField(place)),
      sentence: text(form, sentenceField(place)),
    });
  }
  return sent;
}

/** A name as two names are told apart: without case and the blanks around it. */
function nameKey(name: string): string {
  return name.trim().toLocaleLowerCase("id-ID");
}

function nameFault(
  name: string,
  others: readonly ScoreIndicator[],
): string | undefined {
  const trimmed = name.trim();
  if (trimmed === "") return NAME_EMPTY;
  if (trimmed.length > NAME_MAX) return NAME_TOO_LONG;
  const twins = others.filter((other) => nameKey(other.name) === nameKey(name));
  if (twins.length > 1) return NAMES_EQUAL;
  return undefined;
}

function sentenceFault(sentence: string): string | undefined {
  const trimmed = sentence.trim();
  if (trimmed === "") return SENTENCE_EMPTY;
  if (trimmed.length > SENTENCE_MAX) return SENTENCE_TOO_LONG;
  return undefined;
}

/** What each field of the indicators as typed says is wrong, one entry per indicator. */
export function indicatorFaults(
  typed: readonly ScoreIndicator[],
): IndicatorFault[] {
  return typed.map((indicator) => {
    const fault: IndicatorFault = {};
    const name = nameFault(indicator.name, typed);
    const sentence = sentenceFault(indicator.sentence);
    if (name) fault.name = name;
    if (sentence) fault.sentence = sentence;
    return fault;
  });
}

/** Whether the indicators as typed may be saved: nothing in them is wrong. */
export function maySaveIndicators(typed: readonly ScoreIndicator[]): boolean {
  return indicatorFaults(typed).every(
    (fault) => fault.name === undefined && fault.sentence === undefined,
  );
}

/**
 * Checks "Simpan indikator" as sent: six indicators, each with a name and
 * a sentence that pass their checks, and no two with the same name.
 * Saves nothing when one of them does not.
 */
export function parseIndicators(
  sent: readonly ScoreIndicator[],
): Parsed<ScoreIndicator[]> {
  if (sent.length !== INDICATOR_COUNT) return { ok: false, error: INCOMPLETE };
  if (!maySaveIndicators(sent)) return { ok: false, error: NOT_SAVED };
  const indicators = sent.map((indicator) => ({
    name: indicator.name.trim(),
    sentence: indicator.sentence.trim(),
  }));
  return { ok: true, value: indicators };
}
