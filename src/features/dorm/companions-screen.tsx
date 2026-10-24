import type { SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { database } from "@/db/database";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import type { TabLinksProps } from "@/ui/tab-links";
import { TabbedHead } from "@/ui/tabbed-head";
import { type Candidates, listCandidates } from "./companion-candidates";
import { listCompanions } from "./companion-list";
import { CompanionTable } from "./companion-table";
import { type CompanionsParams, companionsAddress } from "./companions-address";
import { NameCompanionPanel } from "./name-companion-panel";
import styles from "./rooms.module.css";

/** The students the form offers. Null while no academic period runs. */
async function readCandidates(
  db: Database,
  visible: SQL,
  query: string,
): Promise<Candidates | null> {
  const dormCohorts = await readDormCohorts(db);
  if (dormCohorts === null) return null;
  return listCandidates(db, { dormCohorts, visible }, query);
}

export async function CompanionsScreen({
  tabs,
  params,
  visible,
  mayManage,
}: {
  tabs: TabLinksProps;
  params: CompanionsParams;
  /** The student rows the account that opened the page may see. */
  visible: SQL;
  /** Whether the account may name kakak pendamping, or only see them. */
  mayManage: boolean;
}) {
  const db = database();
  const [list, candidates] = await Promise.all([
    listCompanions(db, visible, params.page),
    mayManage ? readCandidates(db, visible, params.query) : null,
  ]);
  return (
    <>
      <TabbedHead
        title="Asrama"
        tabs={tabs}
        lede="Kakak pendamping adalah mahasiswa senior yang ditugaskan tinggal dan mendampingi penghuni di Asrama Dana Rakca (putri) atau Cipta Bakti (putra). Setelah ditetapkan di sini, kakak pendamping dapat diplot ke kamar di tab Ploting kamar."
      />
      {mayManage && (
        <NameCompanionPanel query={params.query} candidates={candidates} />
      )}
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
            <CompanionTable
              companions={list.companions}
              mayManage={mayManage}
            />
            <ListPager
              page={list.page}
              matching={list.matching}
              noun="kakak pendamping"
              addressOf={(page) => companionsAddress({ ...params, page })}
            />
          </>
        )}
      </section>
    </>
  );
}
