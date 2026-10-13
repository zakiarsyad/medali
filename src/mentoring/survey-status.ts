/** Terjadwal, Dibuka, Berakhir and Ditutup. */
export type SurveyStatus = "scheduled" | "open" | "ended" | "closed";

export const SURVEY_STATUS_TITLES: Record<SurveyStatus, string> = {
  scheduled: "Terjadwal",
  open: "Dibuka",
  ended: "Berakhir",
  closed: "Ditutup",
};

/** What the status of a survey period is decided by. */
export interface SurveyDays {
  startsOn: string;
  endsOn: string;
  /** When it was closed by hand, or null. */
  closedAt: Date | null;
}

/**
 * The status of a survey period that is not cancelled, on a day: Ditutup
 * once it is closed by hand, else Terjadwal before its first day, Dibuka
 * from its first to its last day, and Berakhir after that. Nothing is
 * stored for it, so it changes by itself with the date.
 */
export function surveyStatus(period: SurveyDays, today: string): SurveyStatus {
  if (period.closedAt !== null) return "closed";
  if (today < period.startsOn) return "scheduled";
  if (today > period.endsOn) return "ended";
  return "open";
}

/**
 * Whether a period with this status runs: it waits for its first day or
 * is open. While one runs, no other can be opened.
 */
export function runsWith(status: SurveyStatus): boolean {
  return status === "scheduled" || status === "open";
}
