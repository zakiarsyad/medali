import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { campusDay } from "@/academic-periods/campus-day";
import { periodTitle } from "@/academic-periods/period-labels";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import {
  type ClosedSemester,
  readClosedSemesters,
} from "@/character-grades/closed-semesters";
import { readClosingGrades } from "@/character-grades/closing-grades";
import { closingCounts } from "@/character-grades/fixed-grades";
import type { Database } from "@/db/connect";
import { database } from "@/db/database";
import shared from "@/ui/data-screen.module.css";
import type { TabLinksProps } from "@/ui/tab-links";
import { TabbedHead } from "@/ui/tabbed-head";
import { AddPeriodForm } from "./add-period-form";
import { CloseStep } from "./close-step";
import { type OpenStep, PeriodDates, PeriodList } from "./period-list";
import { isClosable, periodStateOf } from "./period-state";
import styles from "./periods.module.css";
import { academicYearOn } from "./suggested-start";

/** What the address asks of the closing: a step to open, or the period just closed. */
export interface CloseAsked {
  /** The period whose closing step is open, or "" for none. */
  stepId: string;
  /** The period a closing just closed, or "" for none. */
  closedId: string;
}

interface Shown {
  periods: AcademicPeriod[];
  closed: ReadonlyMap<string, ClosedSemester>;
  today: string;
}

function RunningPeriod({ running }: { running: AcademicPeriod | null }) {
  if (!running) {
    return <p className={shared.detail}>Belum ada periode yang berjalan.</p>;
  }
  return (
    <>
      <p className={styles.running}>{periodTitle(running)}</p>
      <PeriodDates period={running} />
    </>
  );
}

/**
 * The closing step of the period the address asks for. The counts are
 * read only then, so the page alone stays quick. A period closed since
 * the step was asked for says so instead.
 */
async function readStep(
  db: Database,
  shown: Shown,
  stepId: string,
): Promise<OpenStep | null> {
  const period = shown.periods.find((each) => each.id === stepId);
  if (!period) return null;
  const closing = shown.closed.get(period.id) ?? null;
  const state = periodStateOf(period, closing, shown.today);
  if (state.kind === "closed") {
    const node = (
      <p className={shared.error} role="alert">
        Semester ini sudah ditutup.
      </p>
    );
    return { periodId: period.id, node };
  }
  if (!isClosable(state)) return null;
  const { scheme, rows } = await readClosingGrades(db, period, shown.today);
  const facts = { period, counts: closingCounts(rows), scheme };
  return { periodId: period.id, node: <CloseStep facts={facts} /> };
}

/** "Semester (period) ditutup." once the address names a period that is closed. */
function ClosedMessage({
  shown,
  closedId,
}: {
  shown: Shown;
  closedId: string;
}) {
  const period = shown.periods.find((each) => each.id === closedId);
  if (!period || !shown.closed.has(period.id)) return null;
  return (
    <p className={shared.done} role="status">
      Semester {periodTitle(period)} ditutup.
    </p>
  );
}

export async function PeriodsScreen({
  tabs,
  mayClose,
  asked,
}: {
  tabs: TabLinksProps;
  mayClose: boolean;
  asked: CloseAsked;
}) {
  const db = database();
  const [periods, closed] = await Promise.all([
    readAcademicPeriods(db),
    readClosedSemesters(db),
  ]);
  const today = campusDay();
  const shown = { periods, closed, today };
  const running = runningPeriodOn(periods, today);
  const step = mayClose ? await readStep(db, shown, asked.stepId) : null;
  return (
    <>
      <TabbedHead
        title="Pengaturan"
        tabs={tabs}
        lede="Tahun akademik dan semester Ganjil atau Genap yang sedang berjalan. Semester mahasiswa dan pilihan periode di seluruh aplikasi mengikuti pengaturan ini."
      />
      {periods.length > 0 && (
        <section className={shared.panel}>
          <h2 className={shared.heading}>Periode berjalan</h2>
          <RunningPeriod running={running} />
        </section>
      )}
      <AddPeriodForm startYear={academicYearOn(today)} />
      <section className={shared.panel}>
        <h2 className={shared.heading}>Daftar periode</h2>
        <ClosedMessage shown={shown} closedId={asked.closedId} />
        <PeriodList
          periods={periods}
          today={today}
          closed={closed}
          step={step}
          mayClose={mayClose}
        />
      </section>
    </>
  );
}
