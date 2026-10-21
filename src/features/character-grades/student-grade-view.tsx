import type { CharacterGrade } from "@/character-grades/character-grade";
import { GradeLetterBadge } from "@/character-grades/grade-letter-badge";
import { partScoresOf } from "@/character-grades/grade-list";
import {
  shownFinal,
  shownOneDecimal,
  shownPart,
} from "@/character-grades/grade-words";
import {
  GRADE_PARTS,
  type GradePart,
  type GradeScheme,
} from "@/character-grades/scheme-ids";
import type { StudentGrade } from "@/character-grades/student-grade";
import shared from "@/ui/data-screen.module.css";
import styles from "./character-grades.module.css";
import { PART_LABELS } from "./scheme-words";

/** The highest score of a part, the end of its bar. */
const PART_MAX = 100;

/** A part as "Daftar nilai karakter" writes it: Kehadiran and SKPM with one decimal. */
function shownScore(part: GradePart, score: number | null): string {
  if (part === "attendance" || part === "skpm") return shownOneDecimal(score);
  return shownPart(score);
}

function PartBar({
  part,
  score,
  weight,
}: {
  part: GradePart;
  score: number | null;
  weight: number;
}) {
  const label = `${PART_LABELS[part]} (${weight}%)`;
  return (
    <li className={styles.partBar}>
      <span>{label}</span>
      {score === null ? (
        <span />
      ) : (
        <meter
          className={styles.partMeter}
          min={0}
          max={PART_MAX}
          value={score}
          aria-label={label}
        />
      )}
      <span className={styles.partValue}>{shownScore(part, score)}</span>
    </li>
  );
}

function PassLine({
  grade,
  scheme,
}: {
  grade: CharacterGrade;
  scheme: GradeScheme;
}) {
  if (!grade.complete) return null;
  const reached = grade.passes ? "Memenuhi" : "Belum memenuhi";
  return (
    <p className={styles.note}>
      {reached} batas lulus nilai karakter minimal {scheme.passLetter}.
    </p>
  );
}

/**
 * "Nilai karakter (KEP-220)" in a student's detail: the letter and Nilai
 * akhir, a bar for each part with its weight and score, and whether the
 * grade reaches the pass letter of the scheme in force. A missing part
 * shows "-" and no bar, and the grade "Belum lengkap".
 */
export function StudentGradeView({ grade }: { grade: StudentGrade }) {
  const { row, scheme } = grade;
  const scores = partScoresOf(row);
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>Nilai karakter (KEP-220)</h2>
        <span>
          {row.grade.complete && <GradeLetterBadge grade={row.grade} />}{" "}
          <b className={styles.final}>{shownFinal(row.grade)}</b>
        </span>
      </div>
      <ul className={styles.partBars}>
        {GRADE_PARTS.map((part) => (
          <PartBar
            key={part}
            part={part}
            score={scores[part]}
            weight={scheme.weights[part]}
          />
        ))}
      </ul>
      <PassLine grade={row.grade} scheme={scheme} />
    </section>
  );
}
