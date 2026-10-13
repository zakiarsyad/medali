import { forbidden } from "next/navigation";
import { openPage } from "@/auth/open-page";
import { NotesScreen } from "@/features/mentoring/notes-screen";
import {
  noteRowsFor,
  writtenRowsFor,
} from "@/features/mentoring/visible-notes";

export default async function MentoringNotesPage() {
  const opened = await openPage("pengasuhan", "catatan");
  const { account } = opened;
  if (noteRowsFor(account) === null) forbidden();
  return (
    <NotesScreen
      tabs={{ pagePath: "pengasuhan", tabs: opened.tabs, open: "catatan" }}
      writeLimit={writtenRowsFor(account)}
    />
  );
}
