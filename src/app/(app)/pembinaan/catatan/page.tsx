import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { LightPenaltyLink } from "@/features/guidance/light-penalty-link";
import { readNotesParams } from "@/features/guidance/note-address";
import { type NoteRow, readNoteBoard } from "@/features/guidance/note-board";
import { semesterWords } from "@/features/guidance/note-words";
import { NoteWriting } from "@/features/guidance/note-writing";
import { NotesScreen } from "@/features/guidance/notes-screen";
import { RemoveNoteButton } from "@/features/guidance/remove-note-button";

/**
 * The tab Catatan pelanggaran. Pembina Disiplin Mahasiswa and Kepala
 * Unit write and remove notes, and open "Hukuman ringan" on a
 * Pelanggaran lanjutan; Direktur and Ketua Program Studi read
 * them, Ketua Program Studi their own program only. No other role opens
 * the tab.
 */
export default async function ViolationNotesPage(
  props: PageProps<"/pembinaan/catatan">,
) {
  const opened = await openPage("pembinaan", "catatan");
  const { account } = opened;
  const params = readNotesParams(await props.searchParams);
  const today = campusDay();
  const board = await readNoteBoard(database(), account, params, today);
  if (board === null) forbidden();
  const writes = may(account.roles, "write_violation_notes");
  const records = may(account.roles, "record_discipline_penalties");
  const form = writes ? (
    <NoteWriting
      newKey={crypto.randomUUID()}
      today={today}
      semester={semesterWords(board.period)}
      inForce={`${board.numbers.active}-${board.numbers.first}-${board.numbers.further}-${board.numbers.repeated}`}
    />
  ) : null;
  return (
    <NotesScreen
      tabs={{ pagePath: "pembinaan", tabs: opened.tabs, open: "catatan" }}
      board={board}
      params={params}
      form={form}
      actionsOf={
        writes || records
          ? (row: NoteRow) => (
              <>
                {records && <LightPenaltyLink row={row} />}
                {writes && <RemoveNoteButton id={row.id} />}
              </>
            )
          : null
      }
    />
  );
}
