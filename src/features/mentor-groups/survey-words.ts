import { shownDay } from "@/ui/day";
import type { OpenedSurveyPeriod } from "./open-survey-period";

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
