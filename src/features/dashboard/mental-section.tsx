import { type CountShown, countWords } from "@/health-notes/shown-count";
import type { ScreeningLevel } from "@/mental-health/screening-ids";
import { SCREENING_LEVELS } from "@/mental-health/screening-ids";
import { LEVEL_WORDS } from "@/mental-health/screening-words";
import shared from "@/ui/data-screen.module.css";
import styles from "./dashboard.module.css";
import { MENTAL_SECTION } from "./mental-card";
import { PublishedPanel } from "./mental-published";
import type { MentalRecap, MentalView, ShownMental } from "./mental-recap";
import { assessedLine, MENTAL_TOO_FEW, NOBODY_ASSESSED } from "./mental-words";
import { SectionHead } from "./section-head";

/** The colours of the prototype: fine, Sedang, and Berat or worse. */
const LEVEL_METERS: Record<ScreeningLevel, string | undefined> = {
  normal: styles.okMeter,
  mild: styles.okMeter,
  moderate: styles.warnMeter,
  severe: styles.badMeter,
  extremely_severe: styles.badMeter,
};

function barLength(count: CountShown): number {
  if (count === "<5") return 0;
  return count;
}

/**
 * One bar for each level, as long as its share of the largest. A count
 * sent as "<5" says so and draws no bar.
 */
function LevelBars({ recap }: { recap: ShownMental }) {
  const { byLevel } = recap;
  const largest = Math.max(1, ...Object.values(byLevel).map(barLength));
  return (
    <>
      <ul className={styles.bars}>
        {SCREENING_LEVELS.map((level) => (
          <li key={level} className={styles.bar}>
            <span className={styles.barLabel}>{LEVEL_WORDS[level]}</span>
            <meter
              className={`${styles.meter} ${LEVEL_METERS[level]}`}
              min={0}
              max={largest}
              value={barLength(byLevel[level])}
              aria-label={LEVEL_WORDS[level]}
            />
            <span className={styles.barValue}>
              {countWords(byLevel[level])}
            </span>
          </li>
        ))}
      </ul>
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
      {recap.kind === "shown" && <LevelBars recap={recap} />}
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
