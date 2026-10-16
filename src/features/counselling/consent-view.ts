import type { ConsentStatus, ConsentWay } from "./consent-ids";

/*
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code.
 */

/** A student's one current consent, as a screen shows it. */
export interface ConsentView {
  status: ConsentStatus;
  way: ConsentWay | null;
  /** When it was asked for, recorded or answered last. */
  changedAt: Date;
  /**
   * The Konselor who sent the waiting request or recorded the paper
   * form. Null for the student's own answer, and on the student's page.
   */
  counsellorName: string | null;
  /** What a press sends back, so a change made since is caught. */
  version: string;
}

/** The version a press sends for a student who was never asked. */
export const NO_CONSENT_VERSION = "";

/**
 * A consent as the student's own page shows it: the Konselor who asked
 * or recorded it is not named there, as in the prototype.
 */
export function withoutCounsellor(consent: ConsentView): ConsentView {
  return { ...consent, counsellorName: null };
}

/** The version of a student's consent, or of none. */
export function versionOfConsent(consent: ConsentView | null): string {
  return consent?.version ?? NO_CONSENT_VERSION;
}
