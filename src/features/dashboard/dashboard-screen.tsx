import shared from "@/ui/data-screen.module.css";
import { PageHead } from "@/ui/page-head";
import { AchievementCard } from "./achievement-card";
import { AchievementSection } from "./achievement-section";
import { CohortTable } from "./cohort-table";
import styles from "./dashboard.module.css";
import { filtersInUse } from "./dashboard-address";
import { DashboardFilterBar } from "./dashboard-filter-bar";
import type { DashboardView } from "./dashboard-view";
import { GradeCard } from "./grade-card";
import { PhysicalCard } from "./physical-card";
import { PhysicalSection } from "./physical-section";

/**
 * Where "Lihat rincian" of each section leads, or null for an account
 * that may not open that tab.
 */
export interface DetailLinks {
  assessment: string | null;
  fitness: string | null;
}

function DashboardContent({
  view,
  links,
}: {
  view: DashboardView;
  links: DetailLinks;
}) {
  const { recap, cohorts } = view.achievement;
  return (
    <>
      <div className={styles.cards}>
        <AchievementCard recap={recap} />
        <GradeCard grades={view.grades} />
        <PhysicalCard recap={view.physical} />
      </div>
      <AchievementSection recap={recap} detailAddress={links.assessment}>
        {recap !== null && (
          <CohortTable
            rows={cohorts}
            period={view.period}
            filtered={filtersInUse(view.filters) > 0}
          />
        )}
      </AchievementSection>
      <PhysicalSection
        recap={view.physical}
        limits={view.fitnessLimits}
        detailAddress={links.fitness}
      />
    </>
  );
}

/** Dashboard pembangunan karakter, for the roles that read its numbers. */
export function DashboardScreen({
  view,
  links,
}: {
  view: DashboardView;
  links: DetailLinks;
}) {
  return (
    <>
      <PageHead title="Dashboard pembangunan karakter">
        Empat aspek penilaian mahasiswa aktif: capaian karakter, nilai karakter,
        kesehatan jasmani, dan kesehatan mental. Gunakan filter untuk melihat
        kelompok mahasiswa tertentu.
      </PageHead>
      <DashboardFilterBar view={view} />
      {view.counts.matching === 0 ? (
        <section className={shared.panel}>
          <p className={shared.empty}>
            Tidak ada mahasiswa aktif dengan kombinasi filter ini.
          </p>
        </section>
      ) : (
        <DashboardContent view={view} links={links} />
      )}
    </>
  );
}
