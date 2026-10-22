import { shownRerata } from "@/character-scores/shown-rerata";
import shared from "@/ui/data-screen.module.css";
import styles from "./dashboard.module.css";
import type { ProgramAverage } from "./mentoring-recap";

/** Where the bars start, so the gaps between programs show. */
const BAR_START = 50;
const BAR_END = 100;

/** One program: its name and student count, a bar and its average, or "-" and no bar. */
function ProgramBar({ program }: { program: ProgramAverage }) {
  const { average } = program;
  return (
    <li className={styles.bar}>
      <span className={styles.barLabel}>
        {program.name}{" "}
        <span className={styles.caption}>
          ({program.students.toLocaleString("id-ID")})
        </span>
      </span>
      {average === null ? (
        <span />
      ) : (
        <meter
          className={`${styles.meter} ${styles.mentoringMeter}`}
          min={BAR_START}
          max={BAR_END}
          value={average}
          aria-label={program.name}
        />
      )}
      <span className={styles.barValue}>{shownRerata(average)}</span>
    </li>
  );
}

/**
 * "Capaian MEDALI per program studi": each program of the group, highest
 * average first, as the server sent them.
 */
export function ProgramPanel({ programs }: { programs: ProgramAverage[] }) {
  return (
    <div className={shared.panel}>
      <div className={styles.panelHead}>
        <h3 className={shared.heading}>Capaian MEDALI per program studi</h3>
        <span className={styles.caption}>skala 0–100</span>
      </div>
      <ul className={styles.bars}>
        {programs.map((program) => (
          <ProgramBar key={program.programId} program={program} />
        ))}
      </ul>
      <p className={styles.note}>
        Batang dimulai dari nilai 50 agar selisih antarprodi terlihat.
      </p>
    </div>
  );
}
