import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { listGroupChoices } from "./group-choices";
import { listGroups } from "./group-list";
import {
  GROUP_LIST_ADDRESS,
  type GroupListParams,
  groupListAddress,
} from "./group-list-address";
import { GroupListFilterRow } from "./group-list-filters";
import { GroupListTable } from "./group-list-table";
import { readGroupNumbers } from "./group-numbers";
import { GroupNumbersView } from "./group-numbers-view";
import { USUAL_SIZE_WORDS } from "./group-size";

export async function GroupListScreen({
  tabs,
  limit,
  params,
}: {
  tabs: TabLinksProps;
  /** Which rows the account that opened the page may see. */
  limit: RowLimit;
  params: GroupListParams;
}) {
  const db = database();
  const { filters } = params;
  const [numbers, choices, list] = await Promise.all([
    readGroupNumbers(db, limit),
    listGroupChoices(db, limit),
    listGroups(db, limit, filters, params.page),
  ]);
  return (
    <>
      <PageHead title="Pengasuh">
        Setiap pengasuh membina satu kelompok pengasuhan berisi{" "}
        {USUAL_SIZE_WORDS} mahasiswa. Kelompok dibentuk saat mahasiswa pertama
        kali masuk PKN STAN, tidak mengikuti kelas akademik, dan diasuh pengasuh
        yang sama sampai lulus kecuali ada penggantian.
      </PageHead>
      <TabLinks {...tabs} />
      <GroupNumbersView numbers={numbers} />
      <section className={shared.panel}>
        {/* Made anew for each address, so its fields show what the address holds. */}
        <AutoSubmitForm
          key={groupListAddress(filters)}
          action={GROUP_LIST_ADDRESS}
        >
          <GroupListFilterRow filters={filters} choices={choices} />
        </AutoSubmitForm>
        {list.matching > 0 ? (
          <>
            <GroupListTable groups={list.groups} />
            <ListPager
              page={list.page}
              matching={list.matching}
              noun="kelompok"
              addressOf={(page) => groupListAddress(filters, page)}
            />
          </>
        ) : (
          <p className={shared.empty}>Tidak ada kelompok pada filter ini.</p>
        )}
      </section>
    </>
  );
}
