import type { AcademicPeriod } from "@/academic-periods/academic-period";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { hasEnded } from "./change-period-dates";
import { PeriodDatesForm } from "./period-dates-form";
import { periodTitle } from "./period-labels";
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
  today,
}: {
  periods: AcademicPeriod[];
  running: AcademicPeriod | null;
  /** The day on campus; a period that ended before it cannot be changed. */
  today: string;
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
          {!hasEnded(period, today) && <PeriodDatesForm period={period} />}
        </li>
      ))}
    </ul>
  );
}
