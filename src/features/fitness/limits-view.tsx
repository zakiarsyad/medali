"use client";

import type { ReactNode } from "react";
import { LIMIT_KEYS } from "@/health-notes/fitness-ids";
import shared from "@/ui/data-screen.module.css";
import styles from "./fitness.module.css";
import type { SentLimits } from "./fitness-input";
import { LIMIT_LABELS } from "./fitness-words";

/**
 * "Ambang skor": the lowest score of Prima, Baik and Perlu perhatian,
 * and the line under them. Without `onType` every field is switched off,
 * for a role that only reads the limits.
 */
export function LimitsView({
  typed,
  note,
  onType,
  children,
}: {
  typed: SentLimits;
  /** What is below the limits, and who set them or that they are the starting ones. */
  note: string;
  onType?: (typed: SentLimits) => void;
  /** Under the line: "Simpan ambang", or the line for a role that only reads. */
  children: ReactNode;
}) {
  return (
    <>
      <span className={styles.subheading}>Ambang skor</span>
      <div className={styles.limits}>
        {LIMIT_KEYS.map((key) => (
          <label key={key} className={styles.limitBox}>
            {LIMIT_LABELS[key]}
            <input
              name={key}
              // Not a number box: what is no whole number stays to be read and corrected.
              inputMode="numeric"
              className={`${shared.input} ${styles.numberInput}`}
              value={typed[key]}
              disabled={!onType}
              onChange={(event) =>
                onType?.({ ...typed, [key]: event.target.value })
              }
            />
          </label>
        ))}
      </div>
      <p className={styles.note}>{note}</p>
      {children}
    </>
  );
}
