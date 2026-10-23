import {
  type AccountForAccess,
  may,
  type RowLimit,
  rowLimitForAction,
  rowLimitForPage,
} from "@/auth/access";

/** Whether an account may open, change, close and cancel a survey period. */
export function maySurveyBeManagedBy(account: AccountForAccess): boolean {
  return may(account.roles, "manage_survey_periods");
}

/**
 * Which groups an account may read the survey results of, or null for an
 * account without the right: Ketua Program Studi reads those of their
 * program only. Every read of the results takes its limit from here.
 */
export function surveyResultRowsFor(
  account: AccountForAccess,
): RowLimit | null {
  if (!may(account.roles, "view_survey_results")) return null;
  return rowLimitForAction(account, "view_survey_results");
}

/** What an account that opened the tab "Evaluasi oleh mahasiswa" gets there. */
export interface SurveyRights {
  /** False for an account that only reads the tab: it gets no form and no button. */
  mayManage: boolean;
  /**
   * The students "Responden" counts for the account: those of every
   * program, or only of its own for Ketua Program Studi.
   */
  respondents: RowLimit;
  /** The groups of "Hasil evaluasi per kelompok", or null for none. */
  results: RowLimit | null;
}

/**
 * The rights of an account on the tab. No action guards the reading of
 * the tab, so the students it counts are those of the roles that open
 * Pengasuh.
 */
export function surveyRightsFor(account: AccountForAccess): SurveyRights {
  return {
    mayManage: maySurveyBeManagedBy(account),
    respondents: rowLimitForPage(account, "mentors"),
    results: surveyResultRowsFor(account),
  };
}
