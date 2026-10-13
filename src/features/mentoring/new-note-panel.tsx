import { randomUUID } from "node:crypto";
import { campusDay } from "@/academic-periods/campus-day";
import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import shared from "@/ui/data-screen.module.css";
import { listMentees } from "./mentees";
import styles from "./mentoring.module.css";
import { NoteForm } from "./note-form";

/** The panel "Catatan baru", for an account that may write notes. */
export async function NewNotePanel({
  limit,
}: {
  /** The students the account may write a note for. */
  limit: RowLimit;
}) {
  const mentees = await listMentees(database(), limit);
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Catatan baru</h2>
      {mentees.length === 0 ? (
        <p className={styles.quiet}>
          Anda belum mengasuh kelompok yang memiliki mahasiswa aktif, sehingga
          belum ada mahasiswa yang dapat dicatat.
        </p>
      ) : (
        <NoteForm
          mentees={mentees}
          startWith={null}
          today={campusDay()}
          noteId={randomUUID()}
        />
      )}
    </section>
  );
}
