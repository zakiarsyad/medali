import { LevelBars } from "@/mental-health/level-bars";
import type {
  MentalRecap,
  MentalView,
  ShownMental,
} from "@/mental-health/mental-recap";
import shared from "@/ui/data-screen.module.css";
import styles from "./dashboard.module.css";
import { MENTAL_SECTION } from "./mental-card";
import { PublishedPanel } from "./mental-published";
import { assessedLine, MENTAL_TOO_FEW, NOBODY_ASSESSED } from "./mental-words";
import { SectionHead } from "./section-head";

/** One bar for each level, and how many are assessed. */
function AssessedBars({ recap }: { recap: ShownMental }) {
  return (
    <>
      <LevelBars byLevel={recap.byLevel} />
      <p className={styles.note}>{assessedLine(recap.assessed)}</p>
    </>
  );
}

/**
 * "Kesehatan mental mahasiswa": how many students are at each level,
 * never a name. Without counts it says why.
 */
function LevelPanel({ recap }: { recap: MentalRecap }) {
  return (
    <div className={shared.panel}>
      <div className={styles.panelHead}>
        <h3 className={shared.heading}>Kesehatan mental mahasiswa</h3>
        <span className={styles.caption}>rekap anonim</span>
      </div>
      {recap.kind === "none" && (
        <p className={shared.empty}>{NOBODY_ASSESSED}</p>
      )}
      {recap.kind === "too_few" && (
        <p className={shared.empty}>{MENTAL_TOO_FEW}</p>
      )}
      {recap.kind === "shown" && <AssessedBars recap={recap} />}
    </div>
  );
}

/**
 * Section 4, Kesehatan mental. `detailAddress` leads to Penilaian >
 * Kesehatan mental, for an account that may open it.
 */
export function MentalSection({
  mental,
  detailAddress,
}: {
  mental: MentalView;
  detailAddress: string | null;
}) {
  return (
    <section className={styles.section} aria-labelledby={MENTAL_SECTION}>
      <SectionHead
        number={4}
        id={MENTAL_SECTION}
        title="Kesehatan mental"
        detailAddress={detailAddress}
      >
        Rekap anonim asesmen dan data perorangan yang dipublikasikan konselor
        dengan persetujuan mahasiswa.
      </SectionHead>
      <div className={styles.panels}>
        <LevelPanel recap={mental.recap} />
        <PublishedPanel
          published={mental.published}
          detailAddress={detailAddress}
        />
      </div>
    </section>
  );
}
