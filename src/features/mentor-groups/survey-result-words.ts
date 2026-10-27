import { periodTitle } from "@/academic-periods/period-labels";
import { FEWEST_ANSWERS_SHOWN } from "@/mentoring/survey-statements";
import { SURVEY_STATUS_TITLES } from "@/mentoring/survey-status";
import { DAY, shownDay } from "@/ui/day";
import { shownAverage } from "./evaluation-result";
import { feedbackWeight } from "./survey-form-start";
import type { SurveyGroupResult } from "./survey-result";
import type { ResultFixing, ResultPeriod } from "./survey-result-periods";

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
export const NO_GROUPS_WORDS = "Belum ada kelompok pada periode ini.";

function groupsWords(groups: number): string {
  return `${groups.toLocaleString("id-ID")} kelompok`;
}

/** What the box of a period whose results may be fixed says to Kepala Unit. */
export function fixOfferWords(groups: number): string {
  return `Periode sudah selesai. Tetapkan hasilnya agar ${groupsWords(groups)} yang memiliki nilai evaluasi masuk ke riwayat evaluasi pengasuh.`;
}

/** What "Tetapkan hasil evaluasi" asks first, naming the number of groups. */
export function fixQuestion(groups: number, period: ResultPeriod): string {
  return `Tetapkan hasil evaluasi ${groupsWords(groups)} untuk periode ${periodTitle(period.period)}? Hasil masuk ke riwayat evaluasi pengasuh.`;
}

/** What "Tetapkan hasil evaluasi" says once the results are fixed. */
export function fixedResultsWords(lines: number): string {
  return `Hasil evaluasi ${groupsWords(lines)} ditetapkan.`;
}

/** Who fixed the results of a period and when. */
export function fixedByWords(fixed: ResultFixing): string {
  return `Hasil periode ini sudah ditetapkan ${DAY.format(fixed.at)} oleh ${fixed.byName} dan masuk ke riwayat evaluasi pengasuh.`;
}
