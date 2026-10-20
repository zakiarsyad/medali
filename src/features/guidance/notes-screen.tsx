import type { ReactNode } from "react";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import type { NotesParams } from "./note-address";
import type { NoteBoard, NoteRow } from "./note-board";
import { NoteListPanel } from "./note-list";
import { NoteNumbersRow } from "./note-numbers";
import { NOTES_LEDE, WHO_WRITES } from "./note-words";
import styles from "./violation-notes.module.css";

/**
 * Pembinaan > Catatan pelanggaran, in the prototype's order: the
 * numbers, the form with "Ketentuan" for a writer or the line on who
 * fills the notes for a reader, and the list.
 */
export function NotesScreen({
  tabs,
  board,
  params,
  form,
  actionsOf,
}: {
  tabs: TabLinksProps;
  board: NoteBoard;
  params: NotesParams;
  /** The form and Ketentuan for a writer; null for a reader. */
  form: ReactNode;
  /** The buttons of each row for a writer; null for a reader. */
  actionsOf: ((row: NoteRow) => ReactNode) | null;
}) {
  return (
    <>
      <PageHead title="Pembinaan">{NOTES_LEDE}</PageHead>
      <TabLinks {...tabs} />
      <NoteNumbersRow board={board} />
      {form ?? <p className={styles.readOnly}>{WHO_WRITES}</p>}
      <NoteListPanel board={board} params={params} actionsOf={actionsOf} />
    </>
  );
}
