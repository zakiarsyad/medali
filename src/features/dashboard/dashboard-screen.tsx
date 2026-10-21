import shared from "@/ui/data-screen.module.css";
import { PageHead } from "@/ui/page-head";
import { AchievementCard } from "./achievement-card";
import { AchievementSection } from "./achievement-section";
import { CohortTable } from "./cohort-table";
import styles from "./dashboard.module.css";
import { filtersInUse } from "./dashboard-address";
import { DashboardFilterBar } from "./dashboard-filter-bar";
import type { DashboardView } from "./dashboard-view";
import { PhysicalCard } from "./physical-card";

function DashboardContent({
  view,
  detailAddress,
}: {
  view: DashboardView;
  detailAddress: string | null;
}) {
  const { recap, cohorts } = view.achievement;
  return (
    <>
      <div className={styles.cards}>
        <AchievementCard recap={recap} />
        <PhysicalCard recap={view.physical} />
      </div>
      <AchievementSection recap={recap} detailAddress={detailAddress}>
        {recap !== null && (
          <CohortTable
            rows={cohorts}
            period={view.period}
            filtered={filtersInUse(view.filters) > 0}
          />
        )}
      </AchievementSection>
    </>
  );
}

/**
 * Dashboard pembangunan karakter, for the roles that read its numbers.
 * `detailAddress` leads to Asesmen karakter, for an account that may
 * open it.
 */
export function DashboardScreen({
  view,
  detailAddress,
}: {
  view: DashboardView;
  detailAddress: string | null;
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
        <DashboardContent view={view} detailAddress={detailAddress} />
      )}
    </>
  );
}
