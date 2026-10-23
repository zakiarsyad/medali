import type { ReactNode } from "react";
import { Medal } from "@/character-scores/medal";
import shared from "@/ui/data-screen.module.css";
import { MEDALI_VALUES } from "@/ui/medali-values";
import { ValueSwatch } from "@/ui/value-swatch";
import { ACHIEVEMENT_SECTION } from "./achievement-card";
import type { Recap } from "./achievement-recap";
import {
  averageWords,
  changeWords,
  medalCaption,
  rerataLine,
  TOO_FEW,
} from "./achievement-words";
import styles from "./dashboard.module.css";
import { SectionHead } from "./section-head";

function ValueAverages({ recap }: { recap: Recap }) {
  return (
    <ul className={styles.values}>
      {MEDALI_VALUES.map(({ key, name }) => (
        <li key={key} className={styles.value}>
          <span className={styles.valueName}>
            <ValueSwatch value={key} />
            {name}
          </span>
          <span className={styles.valueScore}>
            {averageWords(recap.averages[key])}
          </span>
          <span className={styles.valueChange}>
            {changeWords(recap.change?.changes[key] ?? null)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The line under the title on the main Dashboard. */
const ACHIEVEMENT_LINE = (
  <>
    Nilai MEDALI dari hasil asesmen karakter (Penilaian &gt; Asesmen karakter):
    mandiri, empati, disiplin, adaptif, loyal, dan integritas.
  </>
);

function AchievementHero({ recap }: { recap: Recap }) {
  return (
    <div className={`${shared.panel} ${styles.hero}`}>
      <ValueAverages recap={recap} />
      <div className={styles.medal}>
        <Medal scores={recap.averages} last={recap.change?.last ?? null} />
        <b>{rerataLine(recap.rerata)}</b>
        <span className={styles.caption}>{medalCaption(recap)}</span>
      </div>
    </div>
  );
}

/**
 * Section 1, Capaian karakter: the average of each nilai with its change
 * since last semester, and the medal of the averages over last semester's
 * as a dashed line. Without a recap it says why there are no numbers:
 * `emptyWords`, or else that the group is too small. `detailAddress` leads
 * to Asesmen karakter, for an account that may open it; `children` is
 * what the section holds below.
 */
export function AchievementSection({
  recap,
  detailAddress,
  line = ACHIEVEMENT_LINE,
  emptyWords = TOO_FEW,
  children,
}: {
  recap: Recap | null;
  detailAddress: string | null;
  /** The line under the title. */
  line?: ReactNode;
  emptyWords?: string;
  children?: ReactNode;
}) {
  return (
    <section className={styles.section} aria-labelledby={ACHIEVEMENT_SECTION}>
      <SectionHead
        number={1}
        id={ACHIEVEMENT_SECTION}
        title="Capaian karakter"
        detailAddress={detailAddress}
      >
        {line}
      </SectionHead>
      {recap === null ? (
        <div className={shared.panel}>
          <p className={shared.empty}>{emptyWords}</p>
        </div>
      ) : (
        <AchievementHero recap={recap} />
      )}
      {children}
    </section>
  );
}
