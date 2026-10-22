import Link from "next/link";
import { NoteItem, NoteItems } from "@/mentoring/note-item";
import { StudentLink } from "@/mentoring/student-link";
import shared from "@/ui/data-screen.module.css";
import styles from "./dashboard.module.css";
import {
  type DashboardFilters,
  studentDetailAddress,
} from "./dashboard-address";
import type { LatestNote } from "./mentoring-recap";

/**
 * "Catatan pengasuhan terbaru": the notes saved last about the students
 * of the filter, as the server sent them. A name opens the student's
 * detail over the Dashboard, for a student the account may open; "Lihat
 * semua" opens Pengasuhan, for an account that may open it.
 */
export function LatestNotesPanel({
  notes,
  filters,
  notesAddress,
}: {
  notes: LatestNote[];
  filters: DashboardFilters;
  notesAddress: string | null;
}) {
  return (
    <div className={shared.panel}>
      <div className={styles.panelHead}>
        <h3 className={shared.heading}>Catatan pengasuhan terbaru</h3>
        {notesAddress !== null && (
          <Link href={notesAddress} className={shared.quiet}>
            Lihat semua
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
                    note.opensDetail
                      ? studentDetailAddress(filters, note.studentId)
                      : null
                  }
                />
              }
            />
          ))}
        </NoteItems>
      )}
    </div>
  );
}
