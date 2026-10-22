import shared from "@/ui/data-screen.module.css";
import type { CharacterGrade } from "./character-grade";
import styles from "./character-grades.module.css";
import { passWords } from "./grade-words";

/** The letter of a grade, marked passing or not, or "-" while it is "Belum lengkap". */
export function GradeLetterBadge({ grade }: { grade: CharacterGrade }) {
  if (!grade.complete) return "-";
  const look = grade.passes ? styles.passes : styles.fails;
  return (
    <span className={`${shared.badge} ${look}`}>
      {grade.letter}
      <span className={shared.hidden}> ({passWords(grade.passes)})</span>
    </span>
  );
}
