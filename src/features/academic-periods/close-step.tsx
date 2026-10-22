import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { periodTitle } from "@/academic-periods/period-labels";
import type { ClosingCounts } from "@/character-grades/fixed-grades";
import { PART_LABELS } from "@/character-grades/grade-words";
import {
  GRADE_PARTS,
  type GradeScheme,
  LIMITED_LETTERS,
} from "@/character-grades/scheme-ids";
import shared from "@/ui/data-screen.module.css";
import { CloseSemesterForm } from "./close-semester-form";
import styles from "./periods.module.css";

/** What the closing step shows of a period before anything is kept. */
export interface CloseStepFacts {
  period: AcademicPeriod;
  counts: ClosingCounts;
  scheme: GradeScheme;
}

function letterLimits(scheme: GradeScheme): string[] {
  const lines = LIMITED_LETTERS.map(
    (letter) => `${letter} mulai ${scheme.lowerLimits[letter]}`,
  );
  return [...lines, `E di bawah ${scheme.lowerLimits.D}`];
}

function Counts({ counts }: { counts: ClosingCounts }) {
  return (
    <ul className={styles.facts}>
      <li>{`${counts.students} mahasiswa aktif`}</li>
      <li>{`${counts.complete} nilai lengkap`}</li>
      <li>{`${counts.incomplete} belum lengkap`}</li>
    </ul>
  );
}

function SchemeKept({ scheme }: { scheme: GradeScheme }) {
  return (
    <>
      <h4 className={styles.factsHeading}>Bobot</h4>
      <ul className={styles.facts}>
        {GRADE_PARTS.map((part) => (
          <li key={part}>{`${PART_LABELS[part]} ${scheme.weights[part]}%`}</li>
        ))}
      </ul>
      <h4 className={styles.factsHeading}>Batas huruf</h4>
      <ul className={styles.facts}>
        {letterLimits(scheme).map((line) => (
          <li key={line}>{line}</li>
        ))}
        <li>{`Batas lulus ${scheme.passLetter}`}</li>
      </ul>
    </>
  );
}

/**
 * "Tutup semester": the counts, the weights and the letter limits a
 * closing of the period keeps, and the tick that must be set first.
 */
export function CloseStep({ facts }: { facts: CloseStepFacts }) {
  const { period, counts, scheme } = facts;
  return (
    <section className={styles.step}>
      <h3 className={shared.heading}>Tutup semester {periodTitle(period)}</h3>
      <p className={shared.detail}>
        Nilai karakter setiap mahasiswa aktif disimpan tetap untuk semester ini,
        dengan bobot dan batas huruf di bawah. Perubahan nilai, bobot, atau
        batas huruf sesudahnya tidak mengubahnya lagi.
      </p>
      <Counts counts={counts} />
      {counts.incomplete > 0 && (
        <p className={shared.detail}>
          Mahasiswa yang belum lengkap disimpan sebagai "Belum lengkap" dengan
          bagian nilai yang sudah ada.
        </p>
      )}
      <SchemeKept scheme={scheme} />
      <CloseSemesterForm periodId={period.id} />
    </section>
  );
}
