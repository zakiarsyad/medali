import type { ReactNode } from "react";
import type { TabLinksProps } from "@/ui/tab-links";
import { TabbedHead, TabNote } from "@/ui/tabbed-head";
import type { PenaltiesParams } from "./penalty-address";
import type { PenaltyBoard } from "./penalty-board";
import { PenaltyListPanel } from "./penalty-list";
import { PenaltyNumbersAbove } from "./penalty-numbers";
import type { RincianAsks } from "./penalty-rincian";
import { PenaltyRulesTable } from "./penalty-rules-table";
import {
  MENTEES_ONLY,
  READER_LEDE,
  RECORDER_LEDE,
  WHO_RECORDS,
} from "./penalty-words";

/**
 * Pembinaan > Pelanggaran disiplin, in the order of the prototype: the
 * numbers, the form with "Konsekuensi" for an account that records,
 * the list, and the rules table. A reader is told under the head who
 * records.
 */
export function PenaltiesScreen({
  tabs,
  board,
  params,
  form,
  mayFollowUp,
  asks,
}: {
  tabs: TabLinksProps;
  board: PenaltyBoard;
  params: PenaltiesParams;
  /** The form and Konsekuensi for an account that records; null for a reader. */
  form: ReactNode;
  /** Whether the account changes the status, the conditions and the Keputusan. */
  mayFollowUp: boolean;
  /** What "Rincian" asks the server once opened; mandatory counselling only for the account that sends to it. */
  asks: RincianAsks;
}) {
  return (
    <>
      <TabbedHead
        title="Pembinaan"
        tabs={tabs}
        lede={form === null ? READER_LEDE : RECORDER_LEDE}
      >
        {board.menteesOnly && <TabNote>{MENTEES_ONLY}</TabNote>}
        {form === null && <TabNote>{WHO_RECORDS}</TabNote>}
      </TabbedHead>
      <PenaltyNumbersAbove numbers={board.numbers}>
        {form}
        <PenaltyListPanel
          board={board}
          params={params}
          mayFollowUp={mayFollowUp}
          asks={asks}
        />
      </PenaltyNumbersAbove>
      <PenaltyRulesTable />
    </>
  );
}
