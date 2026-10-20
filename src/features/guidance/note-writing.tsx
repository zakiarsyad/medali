import { NoteForm } from "./note-form";
import { NoteTerms } from "./note-terms";
import styles from "./violation-notes.module.css";

/** What a writer gets in place of the line on who fills the notes: the form and Ketentuan. */
export function NoteWriting({
  newKey,
  today,
  semester,
  inForce,
}: {
  newKey: string;
  today: string;
  semester: string;
  inForce: string;
}) {
  return (
    <div className={styles.parts}>
      <NoteForm newKey={newKey} today={today} inForce={inForce} />
      <NoteTerms semester={semester} />
    </div>
  );
}
