import type { TabLinksProps } from "@/ui/tab-links";
import { TabbedHead, TabNote } from "@/ui/tabbed-head";
import type { CoachingParams } from "./coaching-address";
import type { CoachingBoard } from "./coaching-board";
import { CoachingListPanel } from "./coaching-list";
import { COACHING_LEDE } from "./coaching-list-words";
import { CoachingNumbersRow } from "./coaching-numbers";
import { MENTEES_ONLY } from "./penalty-words";

/**
 * Pembinaan > Pembinaan karakter, in the order of the prototype: the
 * numbers, then the list with its filters.
 */
export function CoachingScreen({
  tabs,
  board,
  params,
}: {
  tabs: TabLinksProps;
  board: CoachingBoard;
  params: CoachingParams;
}) {
  return (
    <>
      <TabbedHead title="Pembinaan" tabs={tabs} lede={COACHING_LEDE}>
        {board.menteesOnly && <TabNote>{MENTEES_ONLY}</TabNote>}
      </TabbedHead>
      <CoachingNumbersRow numbers={board.numbers} />
      <CoachingListPanel list={board.list} params={params} />
    </>
  );
}
