import type { ReactNode } from "react";
import type { TabLinksProps } from "@/ui/tab-links";
import { TabbedHead, TabNote } from "@/ui/tabbed-head";
import type { NotesParams } from "./note-address";
import type { NoteBoard, NoteRow } from "./note-board";
import { NoteListPanel } from "./note-list";
import { NoteNumbersRow } from "./note-numbers";
import { NOTES_LEDE, WHO_WRITES } from "./note-words";

/**
 * Pembinaan > Catatan pelanggaran, in the prototype's order: the
 * numbers, the form with "Ketentuan" for a writer, and the list. A
 * reader is told under the head who fills the notes.
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
      <TabbedHead title="Pembinaan" tabs={tabs} lede={NOTES_LEDE}>
        {form === null && <TabNote>{WHO_WRITES}</TabNote>}
      </TabbedHead>
      <NoteNumbersRow board={board} />
      {form}
      <NoteListPanel board={board} params={params} actionsOf={actionsOf} />
    </>
  );
}
