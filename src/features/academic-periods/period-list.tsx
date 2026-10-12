import shared from "@/ui/data-screen.module.css";
import type { AcademicPeriod } from "./academic-period";
import { periodTitle, shownDay } from "./period-labels";
import styles from "./periods.module.css";

export function PeriodDates({
  period,
}: {
  period: Pick<AcademicPeriod, "startsOn" | "endsOn">;
}) {
  return (
    <dl className={styles.dates}>
      <div>
        <dt className={shared.detail}>Mulai</dt>
        <dd>{shownDay(period.startsOn)}</dd>
      </div>
      <div>
        <dt className={shared.detail}>Selesai</dt>
        <dd>{shownDay(period.endsOn)}</dd>
      </div>
    </dl>
  );
}

export function PeriodList({
  periods,
  running,
}: {
  periods: AcademicPeriod[];
  running: AcademicPeriod | null;
}) {
  if (periods.length === 0) {
    return <p className={shared.empty}>Belum ada periode akademik.</p>;
  }
  return (
    <ul className={styles.list}>
      {periods.map((period) => (
        <li key={period.id} className={styles.item}>
          <span className={styles.name}>
            {periodTitle(period)}
            {period.id === running?.id && (
              <span className={shared.badge}>Berjalan</span>
            )}
          </span>
          <PeriodDates period={period} />
        </li>
      ))}
    </ul>
  );
}
