import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { ClarificationCards } from "./clarification-cards";
import { ClarificationFilterRow } from "./clarification-filters";
import {
  CLARIFICATIONS_PAGE_SIZE,
  clarificationListAddress,
} from "./clarification-list-address";
import { ClarificationNumbersView } from "./clarification-numbers-view";
import type { Clarifications } from "./clarifications";
import styles from "./clarifications.module.css";

export const NO_CLARIFICATION_MATCHES =
  "Tidak ada klarifikasi pada filter ini.";

/**
 * The tab "Klarifikasi kehadiran": the four numbers, the flow in one
 * sentence, the search and the status choice, and the clarification
 * cards, the newest first.
 */
export function ClarificationsScreen({
  tabs,
  clarifications,
}: {
  tabs: TabLinksProps;
  clarifications: Clarifications;
}) {
  const { counts, filters, askedPage, list } = clarifications;
  return (
    <>
      <PageHead title="Kegiatan karakter">
        Klarifikasi mahasiswa yang tercatat tidak hadir pada kegiatan karakter.
        Periksa alasan dan lampirannya, lalu terima sebagai hadir, terima
        sebagai dispensasi, atau tolak.
      </PageHead>
      <TabLinks {...tabs} />
      <ClarificationNumbersView counts={counts} />
      <p className={styles.flowLine}>
        Alur: mahasiswa mengajukan, lalu Penilai Mahasiswa memverifikasi dan
        memvalidasi. Klarifikasi yang diterima mengubah status menjadi hadir
        atau dispensasi dan langsung memengaruhi nilai kehadiran kegiatan.
      </p>
      <section className={shared.panel}>
        <h2 className={shared.heading}>Klarifikasi kehadiran</h2>
        <ClarificationFilterRow filters={filters} />
        {/*
          Made anew for each address, so a decision made on one page of the
          cards is not shown on another. By the page the address asked for,
          not the one shown: when the last page is emptied the list falls
          back to the page before, and the message and the decided cards
          must stay.
        */}
        <ClarificationCards
          key={clarificationListAddress(filters, askedPage)}
          cards={list.cards}
          emptyWords={NO_CLARIFICATION_MATCHES}
        />
        {list.matching > 0 && (
          <ListPager
            page={list.page}
            matching={list.matching}
            pageSize={CLARIFICATIONS_PAGE_SIZE}
            noun="klarifikasi"
            addressOf={(page) => clarificationListAddress(filters, page)}
          />
        )}
      </section>
    </>
  );
}
