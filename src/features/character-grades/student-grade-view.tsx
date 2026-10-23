import type {
  CharacterGrade,
  PartScores,
} from "@/character-grades/character-grade";
import { GradeLetterBadge } from "@/character-grades/grade-letter-badge";
import { type GradeRow, partScoresOf } from "@/character-grades/grade-list";
import {
  limitedLine,
  PART_LABELS,
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
import { LimitNote } from "@/ui/limit-note";
import styles from "./character-grades.module.css";

/** The highest score of a part, the end of its bar. */
const PART_MAX = 100;

/** A part as "Daftar nilai karakter" writes it: Kehadiran and SKPM with one decimal. */
function shownScore(part: GradePart, score: number | null): string {
  if (part === "attendance" || part === "skpm") return shownOneDecimal(score);
  return shownPart(score);
}

/** What a student's own card adds to a part: what its score is counted from. */
export interface OwnDetail {
  skpmPoints: number;
}

/** What a part's score is counted from, for a counted part that has one. */
function detailOf(
  part: GradePart,
  row: GradeRow,
  own: OwnDetail,
): string | null {
  const { attendance } = row;
  if (part === "attendance" && attendance.percent !== null) {
    return `${attendance.attended} dari ${attendance.counted} kegiatan dan pertemuan`;
  }
  if (part === "skpm" && row.skpm !== null) {
    return `${shownPart(own.skpmPoints)} poin`;
  }
  return null;
}

function PartBar({
  part,
  score,
  weight,
  detail,
}: {
  part: GradePart;
  score: number | null;
  weight: number;
  detail: string | null;
}) {
  const counted = detail === null ? "" : `, ${detail}`;
  const label = `${PART_LABELS[part]} (${weight}%${counted})`;
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

/** From what Nilai akhir a Ringan or Sedang penalty held the grade at 70. */
function LimitLine({ grade }: { grade: CharacterGrade }) {
  if (!grade.complete || grade.limitedFrom === undefined) return null;
  return <LimitNote text={limitedLine(grade.limitedFrom)} />;
}

/** The parts a grade still waits for, named. */
function MissingLine({ scores }: { scores: PartScores }) {
  const missing = GRADE_PARTS.filter((part) => scores[part] === null);
  if (missing.length === 0) return null;
  const named = missing.map((part) => PART_LABELS[part]).join(", ");
  return <p className={styles.note}>Belum ada: {named}.</p>;
}

/**
 * "Nilai karakter (KEP-220)" in a student's detail: the letter and Nilai
 * akhir, a bar for each part with its weight and score, and whether the
 * grade reaches the pass letter of the scheme in force, with the limit
 * of a discipline penalty when it lowered the grade. A missing part
 * shows "-" and no bar, and the grade "Belum lengkap". The student's own
 * card, with `own`, also says what Kehadiran and SKPM are counted from
 * and names the missing parts.
 */
export function StudentGradeView({
  grade,
  own,
}: {
  grade: StudentGrade;
  own?: OwnDetail;
}) {
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
            detail={own ? detailOf(part, row, own) : null}
          />
        ))}
      </ul>
      {own && <MissingLine scores={scores} />}
      <PassLine grade={row.grade} scheme={scheme} />
      <LimitLine grade={row.grade} />
    </section>
  );
}
