import { COACHING_STATUS_WORDS } from "@/character-scores/coaching-status";
import { COACHING_LEVEL_WORDS } from "@/character-scores/coaching-words";
import shared from "@/ui/data-screen.module.css";
import { valueNameOf } from "@/ui/medali-values";
import { toneBadge } from "@/ui/tone-badge";
import type { StudentCoaching } from "./student-coaching";
import styles from "./student-coaching.module.css";

/** "Aspek terlemah: Mandiri." with the note after it on the same line. */
function coachingLine(coaching: StudentCoaching): string {
  const weakest = `Aspek terlemah: ${valueNameOf(coaching.weakest)}.`;
  if (coaching.note === "") return weakest;
  return `${weakest} ${coaching.note}`;
}

/**
 * "Pembinaan (level)" in a student's detail, as the prototype shows it:
 * the status as a badge and one line under it. It has no button, as the
 * status is changed on Pembinaan karakter only.
 */
export function StudentCoachingView({
  coaching,
  forStudent = false,
}: {
  coaching: StudentCoaching;
  /** On Profil saya, where the student is told who to talk to. */
  forStudent?: boolean;
}) {
  const level = COACHING_LEVEL_WORDS[coaching.level].toLowerCase();
  return (
    <section className={`${shared.panel} ${styles.panel}`}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>Pembinaan {level}</h2>
        <span className={toneBadge("bad")}>
          {COACHING_STATUS_WORDS[coaching.status]}
        </span>
      </div>
      <p className={styles.text}>{coachingLine(coaching)}</p>
      {forStudent && (
        <p className={styles.text}>
          Bicarakan langkah berikutnya dengan pengasuh Anda.
        </p>
      )}
    </section>
  );
}
