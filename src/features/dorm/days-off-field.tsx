import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import styles from "./activities.module.css";

/**
 * "Hari tanpa kegiatan rutin ini": a day is picked and marked, and each
 * marked day can be taken off the list again. The list is sent with the
 * form, so it is kept only when the form is saved.
 */
export function DaysOffField({ start }: { start: string[] }) {
  const [daysOff, setDaysOff] = useState(start);
  const [picked, setPicked] = useState("");

  function mark() {
    if (picked === "" || daysOff.includes(picked)) return;
    setDaysOff([...daysOff, picked].sort());
    setPicked("");
  }

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
      {daysOff.length === 0 ? (
        <p className={styles.quietLine}>Belum ada.</p>
      ) : (
        <ul className={styles.chips}>
          {daysOff.map((day) => (
            <li key={day} className={`${shared.badge} ${styles.plain}`}>
              {shownDay(day)}{" "}
              <button
                type="button"
                className={shared.link}
                aria-label={`Hapus ${shownDay(day)}`}
                onClick={() => setDaysOff(daysOff.filter((one) => one !== day))}
              >
                ×
              </button>
              <input type="hidden" name="daysOff" value={day} />
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
