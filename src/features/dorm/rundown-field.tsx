import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import styles from "./activities.module.css";
import type { RundownLine } from "./activity-ids";
import {
  RUNDOWN_ACTIVITY_MAX_LENGTH,
  RUNDOWN_MAX_LINES,
  RUNDOWN_TIME_MAX_LENGTH,
} from "./activity-limits";

/** A line of the field, with the key it keeps while lines come and go. */
interface Line extends RundownLine {
  key: number;
}

/**
 * "Rincian kegiatan": lines of a time and an activity. A line can be
 * added and taken away; one left without an activity is not kept.
 */
export function RundownField({ start }: { start: RundownLine[] }) {
  const [lines, setLines] = useState<Line[]>(
    start.map((line, key) => ({ ...line, key })),
  );
  const [nextKey, setNextKey] = useState(start.length);

  function add() {
    setLines([...lines, { key: nextKey, time: "", activity: "" }]);
    setNextKey(nextKey + 1);
  }

  return (
    <fieldset className={`${styles.full} ${styles.group}`}>
      <legend className={shared.label}>Rincian kegiatan</legend>
      {lines.map((line) => (
        <div key={line.key} className={styles.line}>
          <input
            name="rundownTime"
            className={`${shared.input} ${styles.lineTime}`}
            placeholder="Jam"
            aria-label="Jam"
            maxLength={RUNDOWN_TIME_MAX_LENGTH}
            defaultValue={line.time}
          />
          <input
            name="rundownActivity"
            className={`${shared.input} ${styles.lineActivity}`}
            placeholder="Aktivitas"
            aria-label="Aktivitas"
            maxLength={RUNDOWN_ACTIVITY_MAX_LENGTH}
            defaultValue={line.activity}
          />
          <button
            type="button"
            className={shared.link}
            onClick={() =>
              setLines(lines.filter((one) => one.key !== line.key))
            }
          >
            Hapus
          </button>
        </div>
      ))}
      <div>
        <button
          type="button"
          className={shared.link}
          onClick={add}
          disabled={lines.length >= RUNDOWN_MAX_LINES}
        >
          Tambah baris rincian
        </button>
      </div>
    </fieldset>
  );
}
