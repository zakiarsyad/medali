import Link from "next/link";
import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import styles from "./mentoring.module.css";
import { NoteItem } from "./note-item";
import { KIND_TITLES, NOTE_KINDS, type NoteKind } from "./note-kinds";
import {
  type KindCounts,
  NOTES_PAGE_SIZE,
  type NoteInList,
  type NoteList,
} from "./note-list";
import {
  KIND_PARAM,
  KIND_PATHS,
  NOTES_ADDRESS,
  noteStudentAddress,
  notesAddress,
} from "./notes-address";

function KindFilter({ kind }: { kind: NoteKind | null }) {
  return (
    // Made anew for each kind, so the choice shows what the address holds.
    <AutoSubmitForm key={kind ?? "all"} action={NOTES_ADDRESS}>
      <select
        name={KIND_PARAM}
        className={`${shared.input} ${styles.fit}`}
        defaultValue={kind === null ? "" : KIND_PATHS[kind]}
        aria-label="Filter jenis"
      >
        <option value="">Semua jenis</option>
        {NOTE_KINDS.map((each) => (
          <option key={each} value={KIND_PATHS[each]}>
            {KIND_TITLES[each]}
          </option>
        ))}
      </select>
    </AutoSubmitForm>
  );
}

function CountsByKind({ counts }: { counts: KindCounts }) {
  return (
    <ul className={styles.counts}>
      {NOTE_KINDS.map((kind) => (
        <li key={kind}>
          {KIND_TITLES[kind]} <b>{counts[kind].toLocaleString("id-ID")}</b>
        </li>
      ))}
    </ul>
  );
}

/**
 * The student a note is about: a link that opens their detail over the
 * list for an account that may open it, and the name alone otherwise.
 */
function StudentName({ note, address }: { note: NoteInList; address: string }) {
  if (!note.opensDetail) return <b>{note.studentName}</b>;
  return (
    <Link href={address} scroll={false} className={shared.link}>
      {note.studentName}
    </Link>
  );
}

/**
 * The list "Catatan pengasuhan": the count of each kind, the choice of a
 * kind, and one page of the notes the account may read.
 */
export function NoteListPanel({
  list,
  kind,
}: {
  list: NoteList;
  /** The kind the list is narrowed to. Null means "Semua jenis". */
  kind: NoteKind | null;
}) {
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>Catatan pengasuhan</h2>
        <KindFilter kind={kind} />
      </div>
      <CountsByKind counts={list.counts} />
      {list.notes.length === 0 ? (
        <p className={shared.empty}>Belum ada catatan.</p>
      ) : (
        <>
          <ul className={styles.notes}>
            {list.notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                student={
                  <StudentName
                    note={note}
                    address={noteStudentAddress(
                      kind,
                      list.page,
                      note.studentId,
                    )}
                  />
                }
              />
            ))}
          </ul>
          <ListPager
            page={list.page}
            matching={list.matching}
            pageSize={NOTES_PAGE_SIZE}
            noun="catatan"
            addressOf={(page) => notesAddress(kind, page)}
          />
        </>
      )}
    </section>
  );
}
