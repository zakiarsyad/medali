import { forbidden } from "next/navigation";
import { openPage } from "@/auth/open-page";
import { readNotesParams } from "@/features/mentoring/notes-address";
import { NotesScreen } from "@/features/mentoring/notes-screen";
import {
  noteRowsFor,
  writtenRowsFor,
} from "@/features/mentoring/visible-notes";
import { visibleTo } from "@/features/students/visible-students";

export default async function MentoringNotesPage(
  props: PageProps<"/pengasuhan/catatan">,
) {
  const opened = await openPage("pengasuhan", "catatan");
  const { account } = opened;
  const limit = noteRowsFor(account);
  if (limit === null) forbidden();
  return (
    <NotesScreen
      tabs={{ pagePath: "pengasuhan", tabs: opened.tabs, open: "catatan" }}
      visible={visibleTo(limit)}
      writeLimit={writtenRowsFor(account)}
      params={readNotesParams(await props.searchParams)}
    />
  );
}
