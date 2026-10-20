import {
  FEWEST_FOR_SUGGESTIONS,
  SURVEY_SCALE,
  SURVEY_STATEMENTS,
} from "@/mentoring/survey-statements";
import { shownDay } from "@/ui/day";
import type { OwnSurvey } from "./own-survey";

export const SURVEY_TITLE = "Survei kepuasan pengasuhan";

/** The line under the title: the period and its last day. */
export function surveyPeriodWords(
  survey: Pick<OwnSurvey, "periodTitle" | "endsOn">,
): string {
  return `Periode evaluasi ${survey.periodTitle} · dibuka sampai ${shownDay(survey.endsOn)}`;
}

/** Who sees what of the answers. */
export const PRIVACY_WORDS = `Nilai setiap pernyataan dari 1 (sangat tidak setuju) sampai 5 (sangat setuju). Jawaban Anda tidak ditampilkan per orang: Kepala Unit, Direktur / Wakil Direktur, Pegawai UPK, dan Ketua Program Studi hanya melihat rekap kelompok, dan saran ditampilkan tanpa nama bila responden kelompok minimal ${FEWEST_FOR_SUGGESTIONS} orang.`;

/** "1 = Sangat tidak setuju · … · 5 = Sangat setuju". */
export const SCALE_KEY = SURVEY_SCALE.map(
  (meaning, index) => `${index + 1} = ${meaning}`,
).join(" · ");

export function answeredWords(answered: number): string {
  return `${answered} dari ${SURVEY_STATEMENTS.length} pernyataan dijawab`;
}

export const SENT_THANKS = "Terima kasih. Survei kepuasan pengasuhan terkirim.";
