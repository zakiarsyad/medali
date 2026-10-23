import type { ReactNode } from "react";
import { CategoryBars } from "@/health-notes/category-bars";
import type { FitnessLimits } from "@/health-notes/fitness-ids";
import shared from "@/ui/data-screen.module.css";
import { CategoryMeanings } from "./category-meanings";
import styles from "./dashboard.module.css";
import { PHYSICAL_SECTION } from "./physical-card";
import type { PhysicalRecap, ShownPhysical } from "./physical-recap";
import {
  illnessLine,
  NOBODY_TESTED,
  PHYSICAL_TOO_FEW,
  testedLine,
  untestedLine,
} from "./physical-words";
import { SectionHead } from "./section-head";

function CategoryCounts({
  recap,
  limits,
}: {
  recap: ShownPhysical;
  limits: FitnessLimits;
}) {
  const { illnesses } = recap;
  return (
    <>
      <CategoryBars counts={recap.byCategory} limits={limits} />
      <p className={styles.note}>{untestedLine(recap.untested)}</p>
      {illnesses !== null && illnesses.length > 0 && (
        <p className={styles.note}>{illnessLine(illnesses)}</p>
      )}
    </>
  );
}

/**
 * "Kategori tes kebugaran": how many students are in each category, how
 * many are not tested, and, for an account that may count them, the most
 * common illnesses. Without counts it says why.
 */
function CategoryPanel({
  recap,
  limits,
}: {
  recap: PhysicalRecap;
  limits: FitnessLimits;
}) {
  return (
    <div className={shared.panel}>
      <div className={styles.panelHead}>
        <h3 className={shared.heading}>Kategori tes kebugaran</h3>
        {recap.kind === "shown" && (
          <span className={styles.caption}>{testedLine(recap)}</span>
        )}
      </div>
      {recap.kind === "untested" && (
        <p className={shared.empty}>{NOBODY_TESTED}</p>
      )}
      {recap.kind === "too_few" && (
        <p className={shared.empty}>{PHYSICAL_TOO_FEW}</p>
      )}
      {recap.kind === "shown" && (
        <CategoryCounts recap={recap} limits={limits} />
      )}
    </div>
  );
}

/** The line under the title on the main Dashboard. */
const PHYSICAL_LINE =
  "Kategori dari skor tes kebugaran tahunan (0–100), dengan catatan kesehatan untuk kategori perlu perhatian dan perlu tindak lanjut medis.";

/**
 * Section 3, Kesehatan jasmani: counts only, never a name. `detailAddress`
 * leads to Penilaian jasmani, for an account that may open it.
 */
export function PhysicalSection({
  recap,
  limits,
  detailAddress,
  line = PHYSICAL_LINE,
}: {
  recap: PhysicalRecap;
  limits: FitnessLimits;
  detailAddress: string | null;
  /** The line under the title. */
  line?: ReactNode;
}) {
  return (
    <section className={styles.section} aria-labelledby={PHYSICAL_SECTION}>
      <SectionHead
        number={3}
        id={PHYSICAL_SECTION}
        title="Kesehatan jasmani"
        detailAddress={detailAddress}
      >
        {line}
      </SectionHead>
      <div className={styles.panels}>
        <CategoryPanel recap={recap} limits={limits} />
        <CategoryMeanings limits={limits} />
      </div>
    </section>
  );
}
