import { shownDay } from "@/ui/day";
import type { OpenedSurveyPeriod } from "./open-survey-period";
import type { RunningSurveyCard } from "./survey-card";
import { feedbackWeight } from "./survey-form-start";

/**
 * What "Buka periode evaluasi" says once the period is kept: that it is
 * open and where students fill in the survey, or, for one that starts
 * later, from which day they can.
 */
export function openedSurveyWords(
  opened: OpenedSurveyPeriod,
  today: string,
): string {
  if (opened.startsOn > today) {
    return `Periode evaluasi ${opened.title} dijadwalkan. Mahasiswa dapat mengisi survei di Profil saya mulai ${shownDay(opened.startsOn)}.`;
  }
  return `Periode evaluasi ${opened.title} dibuka. Mahasiswa dapat mengisi survei di Profil saya.`;
}

/** The line under the heading of the card: its two days and who opened it. */
export function surveyDaysWords(
  card: Pick<RunningSurveyCard, "startsOn" | "endsOn" | "openerName">,
): string {
  return `${shownDay(card.startsOn)} sampai ${shownDay(card.endsOn)} · dibuka oleh ${card.openerName}`;
}

/** "Responden": how many of the students who can answer did. */
export function respondentWords(answered: number, pool: number): string {
  return `${answered.toLocaleString("id-ID")} dari ${pool.toLocaleString("id-ID")}`;
}

/** "Bobot": both weights of a period. */
export function weightWords(achievementWeight: number): string {
  return `Capaian ${achievementWeight}% · umpan balik ${feedbackWeight(achievementWeight)}%`;
}

/** What "Simpan tanggal" says once the last day is changed. */
export function endChangedWords(endsOn: string): string {
  return `Tanggal ditutup diubah menjadi ${shownDay(endsOn)}.`;
}

export const CLOSE_QUESTION =
  "Tutup periode evaluasi sekarang? Mahasiswa tidak dapat mengisi survei lagi.";

export const CLOSED_WORDS =
  "Periode evaluasi ditutup. Mahasiswa tidak dapat mengisi survei lagi.";

export const CANCEL_QUESTION = "Batalkan periode ini?";

export const CANCELLED_SURVEY_WORDS = "Periode evaluasi dibatalkan.";
