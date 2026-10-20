import type { Parsed } from "@/parsed";
import { mainIndicators } from "./main-indicators";

export const INDICATOR_MAX_LENGTH = 300;

/** The text to keep for one main indicator. */
export interface IndicatorText {
  code: string;
  text: string;
}

/**
 * Checks the texts sent for the main indicators. `sent` gives the text
 * sent for a code. Only the fixed codes are read, and every one of them
 * must have a text.
 */
export function parseIndicatorTexts(
  sent: (code: string) => string,
): Parsed<IndicatorText[]> {
  const texts: IndicatorText[] = [];
  for (const value of mainIndicators(new Map())) {
    for (const { code } of value.indicators) {
      const text = sent(code).trim();
      if (text === "") {
        const error = `Isi keempat level indikator ${value.name}.`;
        return { ok: false, error };
      }
      if (text.length > INDICATOR_MAX_LENGTH) {
        const error = `Teks indikator paling banyak ${INDICATOR_MAX_LENGTH} karakter.`;
        return { ok: false, error };
      }
      texts.push({ code, text });
    }
  }
  return { ok: true, value: texts };
}
