import { forbidden } from "next/navigation";
import { campusDay } from "@/academic-periods/campus-day";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readNotesParams } from "@/features/guidance/note-address";
import { readNoteBoard } from "@/features/guidance/note-board";
import { NotesScreen } from "@/features/guidance/notes-screen";

/**
 * The tab Catatan pelanggaran. Pembina Disiplin Mahasiswa and Kepala
 * Unit write and remove notes; Direktur and Ketua Program Studi read
 * them, Ketua Program Studi their own program only. No other role opens
 * the tab.
 */
export default async function ViolationNotesPage(
  props: PageProps<"/pembinaan/catatan">,
) {
  const opened = await openPage("pembinaan", "catatan");
  const { account } = opened;
  const params = readNotesParams(await props.searchParams);
  const board = await readNoteBoard(database(), account, params, campusDay());
  if (board === null) forbidden();
  return (
    <NotesScreen
      tabs={{ pagePath: "pembinaan", tabs: opened.tabs, open: "catatan" }}
      board={board}
      params={params}
      form={null}
      actionsOf={null}
    />
  );
}
