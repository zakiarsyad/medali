import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import type { CoachingParams } from "./coaching-address";
import type { CoachingBoard } from "./coaching-board";
import { CoachingListPanel } from "./coaching-list";
import styles from "./coaching-list.module.css";
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
      <PageHead title="Pembinaan">{COACHING_LEDE}</PageHead>
      <TabLinks {...tabs} />
      {board.menteesOnly && <p className={styles.scope}>{MENTEES_ONLY}</p>}
      <CoachingNumbersRow numbers={board.numbers} />
      <CoachingListPanel list={board.list} params={params} />
    </>
  );
}
