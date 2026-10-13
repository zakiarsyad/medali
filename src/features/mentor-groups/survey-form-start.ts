import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { daysAfter } from "@/academic-periods/days-after";
import { periodTitle } from "@/academic-periods/period-labels";
import { scoreOf } from "./evaluation-input";
import { evaluationPeriods } from "./evaluation-periods";

/** How long a survey period lasts unless the form says otherwise. */
const USUAL_DAYS = 14;
const USUAL_ACHIEVEMENT_WEIGHT = 50;
/** What the two weights of a period add up to. */
export const WEIGHT_TOTAL = 100;

/** One Periode the form offers. */
export interface SurveyPeriodChoice {
  id: string;
  /** Such as Ganjil 2026/2027. */
  title: string;
  /** Whether a survey period was opened for it before and not cancelled. */
  wasOpened: boolean;
}

/** What "Buka periode evaluasi pengasuhan" shows before anything is typed. */
export interface SurveyFormStart {
  /** The running academic period first, then the one before it. */
  choices: SurveyPeriodChoice[];
  startsOn: string;
  endsOn: string;
  achievementWeight: number;
}

/**
 * The form as it opens on a day: the academic periods a survey period
 * can be opened for, today, 14 days later and a weight of 50.
 * `openedPeriodIds` are the academic periods that have a survey period
 * which was not cancelled.
 */
export function surveyFormStart(
  periods: readonly AcademicPeriod[],
  openedPeriodIds: readonly string[],
  today: string,
): SurveyFormStart {
  const choices = evaluationPeriods(periods, today).map((period) => ({
    id: period.id,
    title: periodTitle(period),
    wasOpened: openedPeriodIds.includes(period.id),
  }));
  return {
    choices,
    startsOn: today,
    endsOn: daysAfter(today, USUAL_DAYS),
    achievementWeight: USUAL_ACHIEVEMENT_WEIGHT,
  };
}

/** "Bobot umpan balik mahasiswa (%)": the rest of 100. */
export function feedbackWeight(achievementWeight: number): number {
  return WEIGHT_TOTAL - achievementWeight;
}

/**
 * What "Bobot umpan balik mahasiswa (%)" shows for what is typed as the
 * other weight: the rest of 100, or nothing while that is no whole number
 * of 0 to 100.
 */
export function typedFeedbackWeight(typedAchievementWeight: string): string {
  const weight = scoreOf(typedAchievementWeight);
  return weight === null ? "" : String(feedbackWeight(weight));
}

/** What is asked before a Periode is opened a second time. */
export function openAgainQuestion(title: string): string {
  return `Periode ${title} sudah pernah dibuka. Buka lagi sebagai periode baru?`;
}
