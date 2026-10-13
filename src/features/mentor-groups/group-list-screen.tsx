import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import { ListPager } from "@/ui/list-pager";
import { MentorsHead } from "@/ui/mentors-head";
import type { TabLinksProps } from "@/ui/tab-links";
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
import { countPoorGroups, readLastGroupEvaluations } from "./last-evaluations";

export async function GroupListScreen({
  tabs,
  limit,
  evaluationLimit,
  params,
}: {
  tabs: TabLinksProps;
  /** Which rows the account that opened the page may see. */
  limit: RowLimit;
  /**
   * Which evaluations the account may see, or null for an account that
   * may see none: it gets neither "Evaluasi terakhir" nor "Evaluasi
   * kurang".
   */
  evaluationLimit: RowLimit | null;
  params: GroupListParams;
}) {
  const db = database();
  const { filters } = params;
  const [numbers, choices, list, poorGroups] = await Promise.all([
    readGroupNumbers(db, limit),
    listGroupChoices(db, limit),
    listGroups(db, limit, filters, params.page),
    evaluationLimit === null ? null : countPoorGroups(db, evaluationLimit),
  ]);
  const groupIds = list.groups.map((group) => group.id);
  // One read for the whole page of groups, not one for each row.
  const lastEvaluations =
    evaluationLimit === null
      ? null
      : await readLastGroupEvaluations(db, evaluationLimit, groupIds);
  return (
    <>
      <MentorsHead tabs={tabs} />
      <GroupNumbersView numbers={numbers} poorGroups={poorGroups} />
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
            <GroupListTable
              groups={list.groups}
              lastEvaluations={lastEvaluations}
            />
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
