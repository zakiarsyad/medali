"use client";

import { useState } from "react";
import { shownRerata } from "@/character-scores/shown-rerata";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import type { ValueKey } from "@/ui/medali-values";
import { BreakdownBox } from "./breakdown-box";
import { BreakdownForm } from "./breakdown-form";
import styles from "./curriculum.module.css";
import type { ValueIndicators } from "./main-indicators";
import type { TahapBreakdown } from "./stage-breakdown";
import type { TahapScores } from "./tahap-scores";

/**
 * What the six nilai mean at the chosen tahap, one box each, with the form
 * to change one box.
 */
export function BreakdownPanel({
  tahapName,
  breakdown,
  values,
  mayChange,
  scores,
}: {
  tahapName: string;
  breakdown: TahapBreakdown;
  /** The averages of the viewer's assessed students in the tahap, or null for none. */
  scores: TahapScores | null;
  /** Every nilai with its main indicators as they are now. */
  values: ValueIndicators[];
  mayChange: boolean;
}) {
  const [editing, setEditing] = useState<ValueKey | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  function startEditing(key: ValueKey) {
    setSaved(null);
    setEditing(key);
  }

  function showSaved(message: string) {
    setSaved(message);
    setEditing(null);
  }

  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <div>
          <h2 className={shared.heading}>
            Penjabaran MEDALI tahap {tahapName.toLowerCase()}
          </h2>
          <p className={shared.detail}>
            {breakdown.note} Indikator tahap dipilih dari indikator utama.
          </p>
        </div>
        {scores && (
          <span className={shared.detail}>
            Rerata tahap {shownRerata(scores.rerata)}
          </span>
        )}
      </div>
      {saved && (
        <div className={styles.message}>
          <FormMessage state={{ error: null, done: saved }} />
        </div>
      )}
      <div className={styles.breakdowns}>
        {breakdown.values.map((value) => {
          const main = values.find((candidate) => candidate.key === value.key);
          const indicators = main?.indicators ?? [];
          if (editing === value.key) {
            return (
              <BreakdownForm
                key={value.key}
                tahapNo={breakdown.tahapNo}
                value={value}
                indicators={indicators}
                onSaved={showSaved}
                onCancel={() => setEditing(null)}
              />
            );
          }
          return (
            <BreakdownBox
              key={value.key}
              value={value}
              score={scores?.values[value.key] ?? null}
              indicators={indicators.filter(({ code }) =>
                value.indicatorCodes.includes(code),
              )}
            >
              {mayChange && (
                <button
                  type="button"
                  className={`${shared.link} ${styles.changeBox}`}
                  onClick={() => startEditing(value.key)}
                >
                  Ubah
                </button>
              )}
            </BreakdownBox>
          );
        })}
      </div>
    </section>
  );
}
