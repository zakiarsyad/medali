import type { Instrument, ScreeningLevel } from "./screening-ids";
import type { DassScale } from "./screening-rules";

/*
 * The words of a mental health screening on screen. Read by the screen
 * parts in the browser, so nothing here may take from the database code.
 */

export const INSTRUMENT_WORDS: Record<Instrument, string> = {
  dass21: "DASS-21",
  srq20: "SRQ-20",
};

export const SCALE_WORDS: Record<DassScale, string> = {
  depression: "Depresi",
  anxiety: "Kecemasan",
  stress: "Stres",
};

/** "Tingkat" of each level. */
export const LEVEL_WORDS: Record<ScreeningLevel, string> = {
  normal: "Normal",
  mild: "Ringan",
  moderate: "Sedang",
  severe: "Berat",
  extremely_severe: "Sangat berat",
};

/** "Rekomendasi" of each level, when self-harm is not ticked. */
export const ADVICE_WORDS: Record<ScreeningLevel, string> = {
  normal: "Tidak perlu tindak lanjut",
  mild: "Psikoedukasi dan pemantauan",
  moderate: "Konseling",
  severe: "Konseling segera, pertimbangkan rujukan ke psikolog klinis",
  extremely_severe:
    "Konseling segera dan rujukan ke psikolog klinis atau psikiater",
};

/** "Rekomendasi" when self-harm is ticked, whatever the scores. */
export const CRISIS_ADVICE =
  "Tindak lanjut krisis hari ini sesuai protokol kampus";

/** The mark of a screening with self-harm ticked. */
export const RISK_WORDS = "Risiko";

export const SELF_HARM_WORDS =
  "Ada indikasi pikiran atau tindakan menyakiti diri";
