import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import type { Verification } from "./verification";
import styles from "./verification.module.css";
import {
  CARDS_PAGE_SIZE,
  VERIFICATION_ADDRESS,
  type VerificationFilters,
  verificationAddress,
} from "./verification-address";
import { VerificationCardView } from "./verification-card-view";
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
 * activity and status, and the photo cards, the oldest first.
 */
export function VerificationScreen({
  tabs,
  verification,
}: {
  tabs: TabLinksProps;
  verification: Verification;
}) {
  const { numbers, choices, filters, list } = verification;
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
          key={verificationAddress(filters)}
          action={VERIFICATION_ADDRESS}
        >
          <VerificationFilterRow filters={filters} choices={choices} />
        </AutoSubmitForm>
        {list.matching === 0 ? (
          <p className={shared.empty}>{emptyWords(filters)}</p>
        ) : (
          <>
            <div className={styles.photoCards}>
              {list.cards.map((card) => (
                <VerificationCardView key={card.id} card={card} />
              ))}
            </div>
            <ListPager
              page={list.page}
              matching={list.matching}
              pageSize={CARDS_PAGE_SIZE}
              noun="foto"
              addressOf={(page) => verificationAddress(filters, page)}
            />
          </>
        )}
      </section>
    </>
  );
}
