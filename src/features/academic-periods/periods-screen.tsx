import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { campusDay } from "@/academic-periods/campus-day";
import { runningPeriodOn } from "@/academic-periods/running-period";
import { readAcademicPeriods } from "@/academic-periods/stored-periods";
import { database } from "@/db/database";
import shared from "@/ui/data-screen.module.css";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { AddPeriodForm } from "./add-period-form";
import { periodTitle } from "./period-labels";
import { PeriodDates, PeriodList } from "./period-list";
import styles from "./periods.module.css";
import { academicYearOn } from "./suggested-start";

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

export async function PeriodsScreen({ tabs }: { tabs: TabLinksProps }) {
  const periods = await readAcademicPeriods(database());
  const today = campusDay();
  const running = runningPeriodOn(periods, today);
  return (
    <>
      <PageHead title="Periode akademik">
        Tahun akademik dan semester Ganjil atau Genap yang sedang berjalan.
        Semester mahasiswa dan pilihan periode di seluruh aplikasi mengikuti
        pengaturan ini.
      </PageHead>
      <TabLinks {...tabs} />
      {periods.length > 0 && (
        <section className={shared.panel}>
          <h2 className={shared.heading}>Periode berjalan</h2>
          <RunningPeriod running={running} />
        </section>
      )}
      <AddPeriodForm startYear={academicYearOn(today)} />
      <section className={shared.panel}>
        <h2 className={shared.heading}>Daftar periode</h2>
        <PeriodList periods={periods} running={running} today={today} />
      </section>
    </>
  );
}
