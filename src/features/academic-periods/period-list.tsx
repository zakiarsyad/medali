import Link from "next/link";
import type { ReactNode } from "react";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { periodTitle } from "@/academic-periods/period-labels";
import type { ClosedSemester } from "@/character-grades/closed-semesters";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { hasEnded } from "./change-period-dates";
import { closeStepAddress } from "./period-address";
import { PeriodDatesForm } from "./period-dates-form";
import {
  isClosable,
  type PeriodState,
  periodStateOf,
  stateWords,
} from "./period-state";
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

/** The closing step, open under the one period it closes. */
export interface OpenStep {
  periodId: string;
  node: ReactNode;
}

function PeriodItem({
  period,
  state,
  step,
  today,
  mayClose,
}: {
  period: AcademicPeriod;
  state: PeriodState;
  step: ReactNode;
  today: string;
  mayClose: boolean;
}) {
  return (
    <li className={styles.item}>
      <span className={styles.name}>
        {periodTitle(period)}
        <span className={styles.state}>{stateWords(state)}</span>
      </span>
      <PeriodDates period={period} />
      {!hasEnded(period, today) && <PeriodDatesForm period={period} />}
      {mayClose && isClosable(state) && step === null && (
        <Link
          href={closeStepAddress(period.id)}
          scroll={false}
          className={shared.quiet}
        >
          Tutup semester
        </Link>
      )}
      {step}
    </li>
  );
}

export function PeriodList({
  periods,
  today,
  closed,
  step,
  mayClose,
}: {
  periods: AcademicPeriod[];
  /** The day on campus; a period that ended before it cannot be changed. */
  today: string;
  /** The closed semesters, by the key of their period. */
  closed: ReadonlyMap<string, ClosedSemester>;
  step: OpenStep | null;
  /** Whether the account may close a semester; the server asks again. */
  mayClose: boolean;
}) {
  if (periods.length === 0) {
    return <p className={shared.empty}>Belum ada periode akademik.</p>;
  }
  return (
    <ul className={styles.list}>
      {periods.map((period) => (
        <PeriodItem
          key={period.id}
          period={period}
          state={periodStateOf(period, closed.get(period.id) ?? null, today)}
          step={step?.periodId === period.id ? step.node : null}
          today={today}
          mayClose={mayClose}
        />
      ))}
    </ul>
  );
}
