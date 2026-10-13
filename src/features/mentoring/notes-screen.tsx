import type { SQL } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import type { TabLinksProps } from "@/ui/tab-links";
import styles from "./mentoring.module.css";
import { MentoringHead } from "./mentoring-head";
import { NewNotePanel } from "./new-note-panel";
import { listNotes } from "./note-list";
import { NoteListPanel } from "./note-list-panel";
import type { NotesParams } from "./notes-address";

/** The tab "Catatan pendampingan". */
export async function NotesScreen({
  tabs,
  visible,
  detailVisible,
  writeLimit,
  params,
}: {
  tabs: TabLinksProps;
  /** The students whose notes the account that opened the tab may read. */
  visible: SQL;
  /** The students whose detail the account may open, or null for none. */
  detailVisible: SQL | null;
  /**
   * The students the account may write a note for, or null for an
   * account that only reads: it gets no form.
   */
  writeLimit: RowLimit | null;
  params: NotesParams;
}) {
  const list = await listNotes(
    database(),
    visible,
    params.kind,
    params.page,
    detailVisible,
  );
  return (
    <>
      <MentoringHead tabs={tabs} />
      {writeLimit === null && (
        <p className={styles.readOnly}>
          Catatan pendampingan, daftar hadir pertemuan, dan nilai pengasuhan
          hanya diisi oleh pengasuh untuk anak asuhnya. Anda dapat melihat isian
          yang sudah dibuat pengasuh.
        </p>
      )}
      <div className={styles.columns}>
        {writeLimit !== null && (
          <NewNotePanel limit={writeLimit} startWithId={params.writeForId} />
        )}
        <NoteListPanel list={list} kind={params.kind} />
      </div>
    </>
  );
}
