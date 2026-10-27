import { FinalCategoryBadge } from "@/health-notes/category-badge";
import type { ShownCategory } from "@/health-notes/fitness-category";
import {
  NO_NOTE_YET,
  noteText,
  OWN_NOTE_READERS,
} from "@/health-notes/health-words";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import styles from "./fitness.module.css";
import type { RowHealth } from "./fitness-board";
import { needsNote } from "./fitness-list-table";
import type { StudentFitness } from "./student-fitness";

/** What the panel says of a student who never took the test. */
export const NOT_TESTED = "Belum mengikuti tes kebugaran.";

function TestFacts({
  latest,
}: {
  latest: NonNullable<StudentFitness["latest"]>;
}) {
  const year = latest.testedOn.slice(0, 4);
  return (
    <dl className={styles.facts}>
      <div>
        <dt>Skor tes kebugaran {year}</dt>
        <dd className={styles.bigScore}>{latest.score}</dd>
      </div>
      <div>
        <dt>Tanggal tes</dt>
        <dd>{shownDay(latest.testedOn)}</dd>
      </div>
    </dl>
  );
}

/**
 * The note written out, or "Belum ada catatan kesehatan." when the
 * category asks for one; nothing for any other student with no note.
 */
function NoteBox({
  health,
  category,
  isOwn,
}: {
  health: RowHealth;
  category: ShownCategory;
  isOwn: boolean;
}) {
  const text = health.note === null ? "" : noteText(health.note);
  const boxStyle = category === "medical" ? styles.noteBoxWarn : styles.noteBox;
  if (text !== "") {
    return (
      <div className={boxStyle}>
        <b>Catatan kesehatan</b>
        <p>{text}</p>
        {isOwn && <p className={styles.note}>{OWN_NOTE_READERS}</p>}
      </div>
    );
  }
  if (!needsNote(category)) return null;
  return <div className={styles.noteBoxWarn}>{NO_NOTE_YET}</div>;
}

/**
 * "Kesehatan jasmani" in a student's detail: the final category, the
 * latest score with the day of its test, or a line that the student was
 * never tested. The note, and the mark that a note made the category,
 * show only when the reader handed the student's health over. On the
 * student's own Profil saya the note says who else reads it.
 */
export function StudentFitnessView({
  fitness,
  isOwn = false,
}: {
  fitness: StudentFitness;
  isOwn?: boolean;
}) {
  const { latest, final, health } = fitness;
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>Kesehatan jasmani</h2>
        <span>
          <FinalCategoryBadge final={final} showsMark={health !== null} />
        </span>
      </div>
      {latest ? (
        <TestFacts latest={latest} />
      ) : (
        <p className={shared.emptySection}>{NOT_TESTED}</p>
      )}
      {health && (
        <NoteBox health={health} category={final.category} isOwn={isOwn} />
      )}
    </section>
  );
}
