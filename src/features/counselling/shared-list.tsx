import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import styles from "./counselling.module.css";
import { type ScreeningParams, screeningAddress } from "./screening-address";
import { SharedTable } from "./shared-table";
import { SHARED_PAGE_SIZE, type SharedList } from "./shared-view";
import { nothingSharedWords, SHARED_HEADING } from "./shared-words";

/**
 * "Data yang dipublikasikan untuk Anda": one page of the students whose
 * data is published for the recipient, the newest first. Its steps keep
 * what the address holds for "Daftar mahasiswa". On a phone each student
 * is a card.
 */
export function SharedListPanel({
  list,
  params,
}: {
  list: SharedList;
  params: ScreeningParams;
}) {
  return (
    <section className={`${shared.panel} ${styles.stack}`}>
      <h2 className={shared.heading}>{SHARED_HEADING}</h2>
      {list.matching === 0 ? (
        <p className={shared.empty}>{nothingSharedWords(list.menteesOnly)}</p>
      ) : (
        <>
          <SharedTable rows={list.rows} />
          <ListPager
            page={list.page}
            matching={list.matching}
            pageSize={SHARED_PAGE_SIZE}
            noun="mahasiswa"
            keepsPlace
            addressOf={(sharedPage) =>
              screeningAddress({ ...params, sharedPage })
            }
          />
        </>
      )}
    </section>
  );
}
