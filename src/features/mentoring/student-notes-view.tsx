import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import styles from "./mentoring.module.css";
import { NoteItem } from "./note-item";
import type { StudentNotes } from "./student-notes";

/**
 * "Catatan pengasuhan" in a student's detail: how many notes there are
 * about the student, the newest of them, and "Tulis catatan" for an
 * account that may write one for this student.
 */
export function StudentNotesView({
  found,
  writeAddress,
}: {
  found: StudentNotes;
  /**
   * The address of the form with this student chosen, or null for an
   * account that may not write for them: it gets no button.
   */
  writeAddress: string | null;
}) {
  const { notes, count } = found;
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>Catatan pengasuhan</h2>
        <span className={styles.quiet}>
          {count.toLocaleString("id-ID")} catatan
        </span>
      </div>
      {notes.length === 0 ? (
        <p className={styles.quiet}>Belum ada catatan untuk mahasiswa ini.</p>
      ) : (
        <ul className={styles.notes}>
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} />
          ))}
        </ul>
      )}
      {count > notes.length && (
        <p className={styles.quiet}>
          Menampilkan {notes.length.toLocaleString("id-ID")} catatan terbaru.
        </p>
      )}
      {writeAddress !== null && (
        <p className={styles.detailActions}>
          <Link href={writeAddress} className={shared.button}>
            Tulis catatan
          </Link>
        </p>
      )}
    </section>
  );
}
