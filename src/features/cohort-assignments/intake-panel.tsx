import shared from "@/ui/data-screen.module.css";
import { type AssignmentStatus, STATUS_TITLES } from "./assignment-steps";
import styles from "./cohort-assignments.module.css";
import type { IntakeSummary } from "./intake-summary";

/** "1. Mahasiswa baru angkatan": who the penetapan is about. */
export function IntakePanel({
  cohortYear,
  summary,
  status,
}: {
  cohortYear: number;
  summary: IntakeSummary;
  /** The status of the draft, or null while the angkatan has none. */
  status: AssignmentStatus | null;
}) {
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <div>
          <h2 className={shared.heading}>
            1. Mahasiswa baru angkatan {cohortYear}
          </h2>
          <p className={styles.sub}>
            {summary.students.toLocaleString("id-ID")} mahasiswa aktif ·{" "}
            {summary.male} putra, {summary.female} putri
          </p>
        </div>
        {status && (
          <span className={shared.badge}>{STATUS_TITLES[status]}</span>
        )}
      </div>
      <div className={styles.batches}>
        {summary.batches.map((batch) => (
          <span key={batch.label} className={shared.badge}>
            {batch.label} {batch.students}
          </span>
        ))}
      </div>
    </section>
  );
}
