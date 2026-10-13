import {
  type AccountForAccess,
  may,
  type RowLimit,
  rowLimitForPage,
} from "@/auth/access";

/** Whether an account may open, change, close and cancel a survey period. */
export function maySurveyBeManagedBy(account: AccountForAccess): boolean {
  return may(account.roles, "manage_survey_periods");
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
  };
}
