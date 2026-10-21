import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { ManualRecordForm } from "./manual-record-form";
import { PhotoCards } from "./photo-cards";
import type { Verification } from "./verification";
import {
  CARDS_PAGE_SIZE,
  VERIFICATION_ADDRESS,
  type VerificationFilters,
  verificationAddress,
} from "./verification-address";
import { VerificationFilterRow } from "./verification-filters";
import { VerificationNumbersView } from "./verification-numbers-view";

export const NOTHING_WAITS = "Tidak ada swafoto yang menunggu verifikasi.";
export const NOTHING_MATCHES = "Tidak ada data pada filter ini.";

/** What the panel says when no card matches the filters. */
export function emptyWords(filters: VerificationFilters): string {
  return filters.status === "waiting" ? NOTHING_WAITS : NOTHING_MATCHES;
}

/**
 * The tab "Verifikasi presensi": the four numbers, the choices of
 * activity and status, the photo cards, the oldest first, and under them
 * the folded form that records an attendance by hand.
 */
export function VerificationScreen({
  tabs,
  verification,
}: {
  tabs: TabLinksProps;
  verification: Verification;
}) {
  const { numbers, choices, filters, askedPage, list } = verification;
  return (
    <>
      <PageHead title="Kegiatan karakter">
        Periksa foto kehadiran yang diunggah mahasiswa. Presensi yang divalidasi
        dihitung sebagai hadir dalam nilai kehadiran kegiatan.
      </PageHead>
      <TabLinks {...tabs} />
      <VerificationNumbersView numbers={numbers} />
      <section className={shared.panel}>
        <h2 className={shared.heading}>Verifikasi presensi</h2>
        {/* Made anew for each address, so its fields show what the address holds. */}
        <AutoSubmitForm
          key={`filter:${verificationAddress(filters)}`}
          action={VERIFICATION_ADDRESS}
        >
          <VerificationFilterRow filters={filters} choices={choices} />
        </AutoSubmitForm>
        {/*
          Made anew for each address, so a decision made on one page of the
          cards is not shown on another. By the page the address asked for,
          not the one shown: when the last page is emptied the list falls
          back to the page before, and the message and the decided cards
          must stay.
        */}
        <PhotoCards
          key={`cards:${verificationAddress(filters, askedPage)}`}
          cards={list.cards}
          emptyWords={emptyWords(filters)}
        />
        {list.matching > 0 && (
          <ListPager
            page={list.page}
            matching={list.matching}
            pageSize={CARDS_PAGE_SIZE}
            noun="foto"
            addressOf={(page) => verificationAddress(filters, page)}
          />
        )}
      </section>
      <ManualRecordForm />
    </>
  );
}
