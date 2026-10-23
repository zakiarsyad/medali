import type { OwnNote } from "@/mentoring/listed-note";
import { NoteItem, NoteItems } from "@/mentoring/note-item";
import shared from "@/ui/data-screen.module.css";
import styles from "./mentoring.module.css";

/** How many notes show before the rest is folded behind "Tampilkan semua". */
const NOTES_SHOWN = 10;

function OwnNoteItems({ notes }: { notes: OwnNote[] }) {
  return (
    <NoteItems>
      {notes.map((note) => (
        <NoteItem key={note.id} note={note} />
      ))}
    </NoteItems>
  );
}

/**
 * "Catatan pengasuhan" on Profil saya: how many notes there are about the
 * student and each of them, the newest first, without who wrote it. A
 * long list shows its first notes and folds the rest.
 */
export function OwnNotesView({ notes }: { notes: OwnNote[] }) {
  const first = notes.slice(0, NOTES_SHOWN);
  const rest = notes.slice(NOTES_SHOWN);
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>Catatan pengasuhan</h2>
        <span className={styles.quiet}>
          {notes.length.toLocaleString("id-ID")} catatan
        </span>
      </div>
      {notes.length === 0 ? (
        <p className={styles.quiet}>Belum ada catatan.</p>
      ) : (
        <OwnNoteItems notes={first} />
      )}
      {rest.length > 0 && (
        <details>
          <summary className={shared.link}>Tampilkan semua</summary>
          <OwnNoteItems notes={rest} />
        </details>
      )}
    </section>
  );
}
