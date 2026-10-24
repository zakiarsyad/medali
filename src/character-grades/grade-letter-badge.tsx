import shared from "@/ui/data-screen.module.css";
import { toneBadge } from "@/ui/tone-badge";
import type { CharacterGrade } from "./character-grade";
import { passWords } from "./grade-words";

/** The letter of a grade, marked passing or not, or "-" while it is "Belum lengkap". */
export function GradeLetterBadge({ grade }: { grade: CharacterGrade }) {
  if (!grade.complete) return "-";
  const tone = grade.passes ? "good" : "bad";
  return (
    <span className={toneBadge(tone)}>
      {grade.letter}
      <span className={shared.hidden}> ({passWords(grade.passes)})</span>
    </span>
  );
}
