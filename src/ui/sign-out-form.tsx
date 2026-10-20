"use client";

import styles from "./account-box.module.css";
import { deviceStorage, forgetSurveyDrafts } from "./survey-drafts";

/**
 * "Keluar". A plain form, sent by the browser itself: the answer is a
 * new page load, which leaves no page of the app behind to go back to.
 * Before it goes, the device forgets every half-filled survey, so the
 * next person at a shared computer cannot read it.
 */
export function SignOutForm() {
  return (
    <form
      method="post"
      action="/keluar"
      onSubmit={() => forgetSurveyDrafts(deviceStorage(), null)}
    >
      <button type="submit" className={styles.out}>
        Keluar
      </button>
    </form>
  );
}
