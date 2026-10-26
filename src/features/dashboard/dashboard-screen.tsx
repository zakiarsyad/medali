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
import { GradeCohortTable } from "./grade-cohort-table";
import { GradeSection } from "./grade-section";
import { MentalCard } from "./mental-card";
import { MentalSection } from "./mental-section";
import { type MentoringLinks, MentoringSection } from "./mentoring-section";
import { PhysicalCard } from "./physical-card";
import { PhysicalSection } from "./physical-section";

/**
 * Where "Lihat rincian" of each section and each number of Pendampingan
 * leads, or null for an account that may not open that tab.
 */
export interface DetailLinks extends MentoringLinks {
  assessment: string | null;
  grade: string | null;
  fitness: string | null;
  mental: string | null;
}

function DashboardContent({
  view,
  links,
}: {
  view: DashboardView;
  links: DetailLinks;
}) {
  const { recap, cohorts } = view.achievement;
  const { grades } = view;
  const filtered = filtersInUse(view.filters) > 0;
  return (
    <>
      <div className={styles.cards}>
        <AchievementCard recap={recap} />
        <GradeCard grades={grades} />
        <PhysicalCard recap={view.physical} />
        <MentalCard mental={view.mental} />
      </div>
      <AchievementSection recap={recap} detailAddress={links.assessment}>
        {recap !== null && (
          <CohortTable
            rows={cohorts}
            period={view.period}
            filtered={filtered}
          />
        )}
      </AchievementSection>
      <GradeSection grades={grades} detailAddress={links.grade}>
        {grades.recap.kind === "shown" && (
          <GradeCohortTable
            rows={grades.cohorts}
            period={view.period}
            filtered={filtered}
            passLetter={grades.scheme.passLetter}
          />
        )}
      </GradeSection>
      <PhysicalSection
        recap={view.physical}
        limits={view.fitnessLimits}
        detailAddress={links.fitness}
      />
      <MentalSection mental={view.mental} detailAddress={links.mental} />
      <MentoringSection
        mentoring={view.mentoring}
        students={view.counts.matching}
        filters={view.filters}
        links={links}
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
            Tidak ada mahasiswa aktif pada filter ini.
          </p>
        </section>
      ) : (
        <DashboardContent view={view} links={links} />
      )}
    </>
  );
}
