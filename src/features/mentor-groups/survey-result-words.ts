import { periodTitle } from "@/academic-periods/period-labels";
import { FEWEST_ANSWERS_SHOWN } from "@/mentoring/survey-statements";
import { SURVEY_STATUS_TITLES } from "@/mentoring/survey-status";
import { shownDay } from "@/ui/day";
import { shownAverage } from "./evaluation-result";
import { feedbackWeight } from "./survey-form-start";
import type { SurveyGroupResult } from "./survey-result";
import type { ResultPeriod } from "./survey-result-periods";

/** The line under "Hasil evaluasi per kelompok": the period, its days and weights. */
export function resultPeriodWords(period: ResultPeriod): string {
  const days = `${shownDay(period.startsOn)} sampai ${shownDay(period.endsOn)}`;
  const weight = period.achievementWeight;
  const weights = `bobot capaian ${weight}% dan umpan balik ${feedbackWeight(weight)}%`;
  return `Periode ${periodTitle(period.period)} · ${days} · ${weights}`;
}

/** A period in the choice of periods, with its status. */
export function periodChoiceWords(period: ResultPeriod): string {
  return `${periodTitle(period.period)} · ${SURVEY_STATUS_TITLES[period.status]}`;
}

/** A number of one decimal as the app writes it, or a dash for none. */
export function shownNumber(value: number | null): string {
  return value === null ? "-" : shownAverage(value);
}

/** "Umpan balik" out of 5, or a dash for none. */
export function feedbackWords(outOfFive: number | null): string {
  return outOfFive === null ? "-" : `${shownAverage(outOfFive)} / 5`;
}

/** "Responden" of a group: who answered out of its members. */
export function respondentsWords(answers: number, members: number): string {
  return `${answers.toLocaleString("id-ID")}/${members.toLocaleString("id-ID")}`;
}

export const NO_ANSWERS = "Belum ada responden";

/** Why a group has no Predikat. */
export function missingResultWords(result: SurveyGroupResult): string {
  if (result.answers === 0) return NO_ANSWERS;
  if (result.answers < FEWEST_ANSWERS_SHOWN) {
    return `Responden kurang dari ${FEWEST_ANSWERS_SHOWN}`;
  }
  return "Belum ada capaian karakter";
}

export const NO_PERIOD_WORDS =
  "Buka periode evaluasi untuk mulai mengumpulkan umpan balik mahasiswa.";

export const OPEN_PERIOD_WORDS =
  "Periode masih dibuka. Angka di bawah sementara dan diperbarui setiap ada jawaban baru.";

export const NO_MATCH_WORDS = "Tidak ada kelompok pada filter ini.";
