import Link from "next/link";
import type { ReactNode } from "react";
import { NoteItem, NoteItems } from "@/mentoring/note-item";
import { StudentLink } from "@/mentoring/student-link";
import shared from "@/ui/data-screen.module.css";
import styles from "./dashboard.module.css";
import type { LatestNote } from "./mentoring-recap";

/** The link beside the title of the panel. */
export interface PanelLink {
  address: string;
  words: string;
}

/**
 * "Catatan pengasuhan terbaru": the notes saved last, as the server sent
 * them. A name opens the student's detail over the Dashboard, for a
 * student the account may open; the link beside the title, for an
 * account that may open where it leads. What is given below the notes
 * comes after them.
 */
export function LatestNotesPanel({
  notes,
  detailAddressOf,
  link,
  children,
}: {
  notes: LatestNote[];
  detailAddressOf: (studentId: string) => string;
  link: PanelLink | null;
  children?: ReactNode;
}) {
  return (
    <div className={shared.panel}>
      <div className={styles.panelHead}>
        <h3 className={shared.heading}>Catatan pengasuhan terbaru</h3>
        {link !== null && (
          <Link href={link.address} className={shared.quiet}>
            {link.words}
          </Link>
        )}
      </div>
      {notes.length === 0 ? (
        <p className={shared.empty}>Belum ada catatan.</p>
      ) : (
        <NoteItems>
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              student={
                <StudentLink
                  name={note.studentName}
                  address={
                    note.opensDetail ? detailAddressOf(note.studentId) : null
                  }
                />
              }
            />
          ))}
        </NoteItems>
      )}
      {children}
    </div>
  );
}
