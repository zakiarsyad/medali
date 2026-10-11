"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import styles from "./curriculum.module.css";
import { IndicatorBoxes } from "./indicator-boxes";
import { IndicatorForm } from "./indicator-form";
import type { ValueIndicators } from "./main-indicators";

export function MainIndicatorsPanel({
  values,
  note,
  mayChange,
}: {
  values: ValueIndicators[];
  /** Who changed the indicators last, or that they are the starting ones. */
  note: string;
  mayChange: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  function startEditing() {
    setSaved(null);
    setEditing(true);
  }

  function showSaved(message: string) {
    setSaved(message);
    setEditing(false);
  }

  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <div>
          <h2 className={shared.heading}>Indikator utama MEDALI</h2>
          <p className={shared.detail}>
            Empat level per nilai, berjenjang dari tahap penanaman (level 1)
            sampai pematangan (level 4). {note}
          </p>
        </div>
        {mayChange && !editing && (
          <button type="button" className={shared.quiet} onClick={startEditing}>
            Ubah indikator utama
          </button>
        )}
      </div>
      {saved && (
        <div className={styles.message}>
          <FormMessage state={{ error: null, done: saved }} />
        </div>
      )}
      {editing ? (
        <IndicatorForm
          values={values}
          onSaved={showSaved}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <IndicatorBoxes values={values} />
      )}
    </section>
  );
}
