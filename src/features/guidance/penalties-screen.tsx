import type { ReactNode } from "react";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import styles from "./discipline-penalties.module.css";
import type { PenaltiesParams } from "./penalty-address";
import type { PenaltyBoard } from "./penalty-board";
import { PenaltyListPanel } from "./penalty-list";
import { PenaltyNumbersRow } from "./penalty-numbers";
import { PenaltyRulesTable } from "./penalty-rules-table";
import {
  MENTEES_ONLY,
  READER_LEDE,
  RECORDER_LEDE,
  WHO_RECORDS,
} from "./penalty-words";

/**
 * Pembinaan > Pelanggaran disiplin, in the order of the prototype: the
 * numbers, the form with "Konsekuensi" for an account that records or
 * the line on who records for a reader, the list, and the rules table.
 */
export function PenaltiesScreen({
  tabs,
  board,
  params,
  form,
}: {
  tabs: TabLinksProps;
  board: PenaltyBoard;
  params: PenaltiesParams;
  /** The form and Konsekuensi for an account that records; null for a reader. */
  form: ReactNode;
}) {
  return (
    <>
      <PageHead title="Pembinaan">
        {form === null ? READER_LEDE : RECORDER_LEDE}
      </PageHead>
      <TabLinks {...tabs} />
      {board.menteesOnly && <p className={styles.scope}>{MENTEES_ONLY}</p>}
      <PenaltyNumbersRow numbers={board.numbers} />
      {form ?? <p className={styles.readOnly}>{WHO_RECORDS}</p>}
      <PenaltyListPanel board={board} params={params} />
      <PenaltyRulesTable />
    </>
  );
}
