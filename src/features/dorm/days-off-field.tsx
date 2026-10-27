import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { toneBadge } from "@/ui/tone-badge";
import styles from "./activities.module.css";

function DayChip({
  day,
  onRemove,
}: {
  day: string;
  /** Takes the day off the list, or null for a day that stays. */
  onRemove: (() => void) | null;
}) {
  return (
    <li className={toneBadge("plain")}>
      {shownDay(day)}
      {onRemove && (
        <>
          {" "}
          <button
            type="button"
            className={shared.link}
            aria-label={`Hapus ${shownDay(day)}`}
            onClick={onRemove}
          >
            ×
          </button>
          <input type="hidden" name="daysOff" value={day} />
        </>
      )}
    </li>
  );
}

/**
 * "Hari tanpa kegiatan rutin ini": a day is picked and marked, and each
 * marked day of today or later can be taken off the list again. A day off
 * before today stays as it is: it is shown, not sent, and the server
 * keeps it whatever the form sends. The list is kept only when the form
 * is saved.
 */
export function DaysOffField({
  start,
  today,
}: {
  start: string[];
  /** The day on campus. */
  today: string;
}) {
  const past = start.filter((day) => day < today);
  const [daysOff, setDaysOff] = useState(start.filter((day) => day >= today));
  const [picked, setPicked] = useState("");

  function mark() {
    const isMarked = past.includes(picked) || daysOff.includes(picked);
    if (picked === "" || isMarked) return;
    setDaysOff([...daysOff, picked].sort());
    setPicked("");
  }

  const shown = [...past, ...daysOff].sort();
  return (
    <fieldset className={`${styles.full} ${styles.group}`}>
      <legend className={shared.label}>Hari tanpa kegiatan rutin ini</legend>
      <div className={styles.daySwitch}>
        <input
          type="date"
          className={shared.input}
          value={picked}
          aria-label="Tanggal tanpa kegiatan"
          onChange={(event) => setPicked(event.target.value)}
        />
        <button
          type="button"
          className={shared.quiet}
          onClick={mark}
          disabled={picked === ""}
        >
          Tandai tidak ada kegiatan
        </button>
      </div>
      {shown.length === 0 ? (
        <p className={shared.emptySection}>Belum ada.</p>
      ) : (
        <ul className={styles.chips}>
          {shown.map((day) => (
            <DayChip
              key={day}
              day={day}
              onRemove={
                past.includes(day)
                  ? null
                  : () => setDaysOff(daysOff.filter((one) => one !== day))
              }
            />
          ))}
        </ul>
      )}
    </fieldset>
  );
}
