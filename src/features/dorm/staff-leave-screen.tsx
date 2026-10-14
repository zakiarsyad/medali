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
import { LeaveCards, type LeaveRights } from "./leave-cards";
import { LeaveFilterRow } from "./leave-filters";
import type { LeaveBoard } from "./leave-list";

export const NO_LEAVE_MATCHES = "Tidak ada pengajuan pada filter ini.";

/** Whether an account may only see the cards, and change nothing. */
function onlySees(rights: LeaveRights): boolean {
  return !rights.decide && !rights.verify && !rights.validate;
}

/**
 * Perizinan asrama for staff: the numbers Menunggu verifikasi and Izin 30
 * hari terakhir, the search with the status and kind choices, and one
 * page of request cards. Pengelola Asrama approves and rejects there,
 * BAM - BPHK verifies reports of a return and Pengelola validates them;
 * every other role only reads.
 */
export function StaffLeaveScreen({
  tabs,
  params,
  board,
  rights,
}: {
  tabs: TabLinksProps;
  params: LeaveListParams;
  board: LeaveBoard;
  rights: LeaveRights;
}) {
  const { counts, list } = board;
  const { filters } = params;
  const address = leaveListAddress(filters, params.page);
  return (
    <>
      <PageHead title="Perizinan asrama">
        Izin pesiar, Izin Tidak Mengikuti Kegiatan (ITMK), dan izin khusus
        penghuni asrama.
      </PageHead>
      <TabLinks {...tabs} />
      {onlySees(rights) && (
        <p className={styles.note}>
          Menu asrama dikelola oleh Pengelola Asrama. Anda dapat melihat rekap
          dan rinciannya.
        </p>
      )}
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
        {/*
          Made anew for each address, so a decision made on one page is not
          shown on another. By the page the address asked for, not the one
          shown, so a decided card stays when the list shrinks.
        */}
        <LeaveCards
          key={address}
          cards={list.cards}
          rights={rights}
          emptyWords={NO_LEAVE_MATCHES}
        />
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
