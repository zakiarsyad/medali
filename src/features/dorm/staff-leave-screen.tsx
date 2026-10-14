import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import styles from "./leave.module.css";
import {
  LEAVE_CARDS_PAGE_SIZE,
  type LeaveListParams,
  leaveListAddress,
} from "./leave-address";
import { LeaveCardView } from "./leave-card-view";
import { LeaveFilterRow } from "./leave-filters";
import type { LeaveBoard } from "./leave-list";

export const NO_LEAVE_MATCHES = "Tidak ada pengajuan pada filter ini.";

/**
 * Perizinan asrama for staff: the numbers Menunggu verifikasi and Izin 30
 * hari terakhir, the search with the status and kind choices, and one
 * page of request cards. Read only for every role but Pengelola Asrama.
 */
export function StaffLeaveScreen({
  tabs,
  params,
  board,
}: {
  tabs: TabLinksProps;
  params: LeaveListParams;
  board: LeaveBoard;
}) {
  const { counts, list } = board;
  const { filters } = params;
  return (
    <>
      <PageHead title="Perizinan asrama">
        Izin pesiar, Izin Tidak Mengikuti Kegiatan (ITMK), dan izin khusus
        penghuni asrama.
      </PageHead>
      <TabLinks {...tabs} />
      <p className={styles.note}>
        Menu asrama dikelola oleh Pengelola Asrama. Anda dapat melihat rekap dan
        rinciannya.
      </p>
      <NumberCards>
        <NumberCard
          label="Menunggu verifikasi"
          amount={counts.waiting}
          note="pengajuan"
        />
        <NumberCard
          label="Izin 30 hari terakhir"
          amount={counts.recentApproved}
          note="disetujui"
        />
      </NumberCards>
      <section className={shared.panel}>
        <LeaveFilterRow filters={filters} />
        {list.cards.length === 0 ? (
          <p className={shared.empty}>{NO_LEAVE_MATCHES}</p>
        ) : (
          <ul className={styles.cards}>
            {list.cards.map((card) => (
              <LeaveCardView key={card.id} card={card} />
            ))}
          </ul>
        )}
        {list.matching > 0 && (
          <ListPager
            page={list.page}
            matching={list.matching}
            pageSize={LEAVE_CARDS_PAGE_SIZE}
            noun="pengajuan"
            addressOf={(page) => leaveListAddress(filters, page)}
          />
        )}
      </section>
    </>
  );
}
