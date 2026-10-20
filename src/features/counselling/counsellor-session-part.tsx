"use client";

import type { ConsentView } from "./consent-view";
import styles from "./counselling.module.css";
import { SessionForm } from "./session-form";
import { NEEDS_CONSENT } from "./session-words";

/**
 * The sessions of the student picked in "Persetujuan konseling": "Catat
 * sesi" while the consent is Disetujui, or why no session can be written
 * while it is not.
 */
export function CounsellorSessionPart({
  studentId,
  consent,
}: {
  studentId: string;
  consent: ConsentView | null;
}) {
  if (consent?.status !== "approved") {
    return <p className={styles.sub}>{NEEDS_CONSENT}</p>;
  }
  return <SessionForm key={studentId} studentId={studentId} />;
}
