import type { SQL } from "drizzle-orm";
import { database } from "@/db/database";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { listCompanions } from "./companion-list";
import { CompanionTable } from "./companion-table";
import { type CompanionsParams, companionsAddress } from "./companions-address";
import styles from "./rooms.module.css";

export async function CompanionsScreen({
  tabs,
  params,
  visible,
}: {
  tabs: TabLinksProps;
  params: CompanionsParams;
  /** The student rows the account that opened the page may see. */
  visible: SQL;
}) {
  const list = await listCompanions(database(), visible, params.page);
  return (
    <>
      <PageHead title="Kakak pendamping" />
      <TabLinks {...tabs} />
      <p className={styles.note}>
        Kakak pendamping adalah mahasiswa senior yang ditugaskan tinggal dan
        mendampingi penghuni di Asrama Dana Rakca (putri) atau Cipta Bakti
        (putra). Setelah ditetapkan di sini, kakak pendamping dapat diplot ke
        kamar di tab Ploting kamar.
      </p>
      <section className={shared.panel}>
        <div className={styles.head}>
          <h2 className={`${shared.heading} ${styles.title}`}>
            Daftar kakak pendamping
          </h2>
          <span className={styles.quietLine}>
            {list.active.toLocaleString("id-ID")} aktif
          </span>
        </div>
        {list.matching === 0 ? (
          <p className={shared.empty}>Belum ada kakak pendamping.</p>
        ) : (
          <>
            <CompanionTable companions={list.companions} />
            <ListPager
              page={list.page}
              matching={list.matching}
              noun="kakak pendamping"
              addressOf={companionsAddress}
            />
          </>
        )}
      </section>
    </>
  );
}
