import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { NumberCard, NumberCards } from "@/ui/number-cards";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import {
  CLARIFICATIONS_PAGE_SIZE,
  type ClarificationListParams,
  clarificationListAddress,
  emptyWords,
} from "./clarification-address";
import { ClarificationCards } from "./clarification-cards";
import { ClarificationFilterRow } from "./clarification-filters";
import type { ClarificationBoard } from "./clarification-list";
import own from "./clarifications.module.css";
import styles from "./leave.module.css";

/** What the signed-in account may do on the cards. */
export interface ClarificationRights {
  /** Pass on and reject what waits for BAM: BAM - BPHK and BAM - KI. */
  verify: boolean;
  /** Accept and reject what BAM passed on: Pengelola Asrama. */
  decide: boolean;
}

/**
 * Klarifikasi kehadiran asrama for staff: the numbers Menunggu
 * verifikasi BAM, Menunggu validasi pengelola, Diterima and Ditolak, the
 * flow in one note, "Klarifikasi ditolak dan penetapan SP" for the roles
 * that get it, the search with the status choice, and one page of
 * clarification cards. The roles that only read are told so.
 */
export function ClarificationsScreen({
  tabs,
  params,
  board,
  rights,
  ownStudentId,
  rejectedPanel = null,
}: {
  tabs: TabLinksProps;
  params: ClarificationListParams;
  board: ClarificationBoard;
  rights: ClarificationRights;
  /** The student the account belongs to, whose own clarification it does not check. */
  ownStudentId: string | null;
  /** "Klarifikasi ditolak dan penetapan SP", or null for an account that does not get it. */
  rejectedPanel?: ReactNode;
}) {
  const { counts, list } = board;
  const { filters } = params;
  const address = clarificationListAddress(filters, params.page);
  return (
    <>
      <PageHead title="Klarifikasi kehadiran asrama">
        Klarifikasi mahasiswa asrama yang tercatat tidak hadir, beserta
        lampirannya.
      </PageHead>
      <TabLinks {...tabs} />
      {!rights.verify && !rights.decide && (
        <p className={styles.note}>
          Menu asrama dikelola oleh Pengelola Asrama. Anda dapat melihat rekap
          dan rinciannya.
        </p>
      )}
      <NumberCards>
        <NumberCard
          label="Menunggu verifikasi BAM"
          amount={counts.submitted}
          note="klarifikasi"
        />
        <NumberCard
          label="Menunggu validasi pengelola"
          amount={counts.verified}
          note="klarifikasi"
        />
        <NumberCard
          label="Diterima"
          amount={counts.accepted}
          note="klarifikasi"
        />
        <NumberCard
          label="Ditolak"
          amount={counts.rejected}
          note="klarifikasi"
        />
      </NumberCards>
      <p className={own.flow}>
        Alur: BAM mengumumkan ketidakhadiran, mahasiswa mengajukan klarifikasi,
        BAM menerima dan meneruskan ke Pengelola Asrama atau menolaknya, lalu
        Pengelola Asrama menerima sebagai hadir, izin, atau menolak.
      </p>
      {rejectedPanel}
      <section className={shared.panel}>
        <ClarificationFilterRow filters={filters} />
        {/*
          Made anew for each address, so what was done on one page is not
          shown on another.
        */}
        <ClarificationCards
          key={address}
          cards={list.cards}
          rights={rights}
          ownStudentId={ownStudentId}
          emptyWords={emptyWords(filters)}
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
