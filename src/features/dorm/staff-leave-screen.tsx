import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import type { TabLinksProps } from "@/ui/tab-links";
import { TabbedHead } from "@/ui/tabbed-head";
import {
  LEAVE_CARDS_PAGE_SIZE,
  LEAVE_START_STATUS,
  type LeaveFilters,
  type LeaveListParams,
  leaveListAddress,
} from "./leave-address";
import { LeaveCards, type LeaveRights } from "./leave-cards";
import { LeaveFilterRow } from "./leave-filters";
import type { LeaveBoard } from "./leave-list";
import { ManagedNote } from "./managed-note";

export const NO_LEAVE_MATCHES = "Tidak ada pengajuan pada filter ini.";
export const NO_LEAVE = "Belum ada pengajuan izin.";
export const NO_LEAVE_WAITING = "Tidak ada pengajuan yang menunggu.";

/**
 * What the list says when it is empty. The list starts at "Menunggu", so
 * there it says nothing waits; with every status and nothing else
 * chosen it says there is none yet.
 */
export function noLeaveWords(filters: LeaveFilters): string {
  if (filters.query !== "" || filters.kind !== "all") return NO_LEAVE_MATCHES;
  if (filters.status === "all") return NO_LEAVE;
  if (filters.status === LEAVE_START_STATUS) return NO_LEAVE_WAITING;
  return NO_LEAVE_MATCHES;
}

/** Whether an account may only see the cards, and change nothing. */
function onlySees(rights: LeaveRights): boolean {
  return !rights.decide && !rights.verify && !rights.validate && !rights.record;
}

/**
 * Perizinan asrama for staff: the numbers Menunggu verifikasi, Laporan
 * kembali menunggu, Sedang di luar, Terlambat kembali and Izin 30 hari
 * terakhir, the search with the status and kind choices, and one
 * page of request cards. Pengelola Asrama approves and rejects there,
 * BAM - BPHK verifies reports of a return and Pengelola validates them,
 * and both record a return directly; every other role only reads.
 * `ownPart` is the resident part of an account that also lives in the
 * dorm, shown above the numbers.
 */
export function StaffLeaveScreen({
  tabs,
  params,
  board,
  rights,
  ownPart,
  ownStudentId,
}: {
  tabs: TabLinksProps;
  params: LeaveListParams;
  board: LeaveBoard;
  rights: LeaveRights;
  /** The account's own resident part; null when it has none. */
  ownPart: ReactNode;
  /** The student the account belongs to, whose own leave it does not decide. */
  ownStudentId: string | null;
}) {
  const { counts, list } = board;
  const { filters } = params;
  const { ownPage } = params;
  const address = leaveListAddress(filters, params.page, ownPage);
  return (
    <>
      <TabbedHead
        title="Asrama"
        tabs={tabs}
        lede="Izin pesiar, Izin Tidak Mengikuti Kegiatan (ITMK), dan izin khusus penghuni asrama."
      >
        {onlySees(rights) && <ManagedNote />}
      </TabbedHead>
      {ownPart}
      <NumberCards>
        <NumberCard
          label="Menunggu verifikasi"
          amount={counts.waiting}
          note="pengajuan"
        />
        <NumberCard
          label="Laporan kembali menunggu"
          amount={counts.waitingReports}
          note="verifikasi BAM atau validasi"
        />
        <NumberCard
          label="Sedang di luar"
          amount={counts.out}
          note="izin disetujui"
        />
        <NumberCard
          label="Terlambat kembali"
          amount={counts.late}
          note="termasuk yang sudah kembali"
        />
        <NumberCard
          label="Izin 30 hari terakhir"
          amount={counts.recentApproved}
          note="disetujui"
        />
      </NumberCards>
      <section className={shared.panel}>
        <LeaveFilterRow filters={filters} ownPage={ownPage} />
        {/*
          Made anew for each address, so a decision made on one page is not
          shown on another. By the page the address asked for, not the one
          shown, so a decided card stays when the list shrinks.
        */}
        <LeaveCards
          key={address}
          cards={list.cards}
          rights={rights}
          ownStudentId={ownStudentId}
          asOf={board.asOf}
          emptyWords={noLeaveWords(filters)}
        />
        {list.matching > 0 && (
          <ListPager
            page={list.page}
            matching={list.matching}
            pageSize={LEAVE_CARDS_PAGE_SIZE}
            noun="pengajuan"
            addressOf={(page) => leaveListAddress(filters, page, ownPage)}
          />
        )}
      </section>
    </>
  );
}
