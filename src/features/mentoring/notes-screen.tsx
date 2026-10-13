import type { RowLimit } from "@/auth/access";
import type { TabLinksProps } from "@/ui/tab-links";
import { MentoringHead } from "./mentoring-head";
import { NewNotePanel } from "./new-note-panel";

/** The tab "Catatan pendampingan". */
export function NotesScreen({
  tabs,
  writeLimit,
}: {
  tabs: TabLinksProps;
  /**
   * The students the account may write a note for, or null for an
   * account that only reads: it gets no form.
   */
  writeLimit: RowLimit | null;
}) {
  return (
    <>
      <MentoringHead tabs={tabs} />
      {writeLimit !== null && <NewNotePanel limit={writeLimit} />}
    </>
  );
}
