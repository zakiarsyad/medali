import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import type { TabLinksProps } from "@/ui/tab-links";
import { listMentors } from "./mentor-list";
import {
  MENTOR_LIST_ADDRESS,
  type MentorListParams,
  mentorListAddress,
} from "./mentor-list-address";
import { MentorListFilterRow } from "./mentor-list-filters";
import { MentorListFoot } from "./mentor-list-foot";
import { MentorListTable } from "./mentor-list-table";
import { listMentorUnits } from "./mentor-units";
import { MentorsHead } from "./mentors-head";

export async function MentorListScreen({
  tabs,
  limit,
  params,
}: {
  tabs: TabLinksProps;
  /** Which mentors the account that opened the page may see. */
  limit: RowLimit;
  params: MentorListParams;
}) {
  const db = database();
  const { filters } = params;
  const [units, list] = await Promise.all([
    listMentorUnits(db, limit),
    listMentors(db, limit, filters, params.page),
  ]);
  return (
    <>
      <MentorsHead tabs={tabs} />
      <section className={shared.panel}>
        {/* Made anew for each address, so its fields show what the address holds. */}
        <AutoSubmitForm
          key={mentorListAddress(filters)}
          action={MENTOR_LIST_ADDRESS}
        >
          <MentorListFilterRow filters={filters} units={units} />
        </AutoSubmitForm>
        {list.matching > 0 ? (
          <>
            <MentorListTable mentors={list.mentors} />
            <MentorListFoot
              page={list.page}
              matching={list.matching}
              addressOf={(page) => mentorListAddress(filters, page)}
            />
          </>
        ) : (
          <p className={shared.empty}>Tidak ada pengasuh pada filter ini.</p>
        )}
      </section>
    </>
  );
}
