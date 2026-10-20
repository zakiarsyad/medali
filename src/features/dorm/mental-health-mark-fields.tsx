"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import styles from "./dorm-health.module.css";
import {
  MARK_CATEGORIES,
  type MentalHealthMark,
  OBSERVATION_MAX,
} from "./mental-health-mark-ids";
import {
  MARK_CHOICE_WORDS,
  MARK_FORM_NOTE,
  NO_MARK_WORDS,
  OBSERVATION_PLACEHOLDER,
} from "./mental-health-mark-words";

/**
 * "Potensi kesehatan mental" in the health form, filled with the
 * student's current mark, which it sends back, so a save changes the
 * mark only when it was changed here. "Pengamatan (rahasia)" is closed while
 * "Tidak ada indikasi" is chosen, as that choice clears it.
 */
export function MarkFields({ mark }: { mark: MentalHealthMark | null }) {
  const [category, setCategory] = useState<string>(mark?.category ?? "");
  const [observation, setObservation] = useState(mark?.observation ?? "");
  return (
    <div className={styles.markPart}>
      <input
        type="hidden"
        name="markFilledCategory"
        value={mark?.category ?? ""}
      />
      <input
        type="hidden"
        name="markFilledObservation"
        value={mark?.observation ?? ""}
      />
      <span className={shared.label}>Potensi kesehatan mental</span>
      <p className={styles.note}>{MARK_FORM_NOTE}</p>
      <div className={shared.form}>
        <label className={shared.field}>
          Kategori potensi
          <select
            name="markCategory"
            className={shared.input}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">{NO_MARK_WORDS}</option>
            {MARK_CATEGORIES.map((each) => (
              <option key={each} value={each}>
                {MARK_CHOICE_WORDS[each]}
              </option>
            ))}
          </select>
        </label>
        <label className={shared.field}>
          Pengamatan (rahasia)
          <input
            name="markObservation"
            className={shared.input}
            maxLength={OBSERVATION_MAX}
            placeholder={OBSERVATION_PLACEHOLDER}
            value={category === "" ? "" : observation}
            disabled={category === ""}
            onChange={(event) => setObservation(event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
