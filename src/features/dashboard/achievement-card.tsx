import { shownRerata } from "@/character-scores/shown-rerata";
import { SpreadBar } from "@/character-scores/spread-bar";
import type { Recap } from "./achievement-recap";
import { cardLine, TOO_FEW } from "./achievement-words";
import { CardBox } from "./card-box";
import styles from "./dashboard.module.css";

/** Where section 1 starts, for the card that leads to it. */
export const ACHIEVEMENT_SECTION = "capaian-karakter";

/**
 * The card "Capaian karakter": the average Rerata, how many are assessed
 * with the counts of Emas and Perlu pembinaan, and the predikat spread.
 * Unless `linked` is off, pressing it moves the page to section 1.
 * Without a recap it says why.
 */
export function AchievementCard({
  recap,
  linked = true,
}: {
  recap: Recap | null;
  /** Whether pressing it moves the page to its section: not where there is none. */
  linked?: boolean;
}) {
  return (
    <CardBox target={linked ? ACHIEVEMENT_SECTION : null}>
      <span className={styles.cardHead}>
        <span className={styles.sectionNo}>1</span>
        Capaian karakter
      </span>
      {recap === null ? (
        <span className={styles.cardLine}>{TOO_FEW}</span>
      ) : (
        <>
          <span className={styles.cardValue}>
            {shownRerata(recap.rerata)} <small>MEDALI</small>
          </span>
          <span className={styles.cardLine}>{cardLine(recap)}</span>
          <SpreadBar spread={recap.spread} />
        </>
      )}
    </CardBox>
  );
}
