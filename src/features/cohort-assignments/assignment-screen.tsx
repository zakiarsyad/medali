import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import shared from "@/ui/data-screen.module.css";
import { MentorsHead } from "@/ui/mentors-head";
import type { TabLinksProps } from "@/ui/tab-links";
import styles from "./cohort-assignments.module.css";
import { listCohorts } from "./cohort-list";
import { chosenCohort } from "./cohort-rows";
import { CohortTable } from "./cohort-table";
import { FlowPanel } from "./flow-panel";
import { OpenCohort } from "./open-cohort";

/** The tab "Penetapan angkatan baru". */
export async function AssignmentScreen({
  tabs,
  limit,
  mayPrepare,
  mayFix,
  askedYear,
  askedGroupId,
}: {
  tabs: TabLinksProps;
  /** Which penetapan rows the account that opened the tab may see. */
  limit: RowLimit;
  /** Whether the account may form groups, or only reads. */
  mayPrepare: boolean;
  /** Whether the account may fix a penetapan and cancel a fixed one. */
  mayFix: boolean;
  /** The angkatan the address asks for, if any. */
  askedYear: number | null;
  /** The group whose members the address asks to show, if any. */
  askedGroupId: string | null;
}) {
  const cohorts = await listCohorts(database(), limit);
  const chosen = chosenCohort(cohorts, askedYear);
  return (
    <>
      <MentorsHead tabs={tabs} />
      <div className={styles.pair}>
        <section className={shared.panel}>
          <h2 className={shared.heading}>Angkatan</h2>
          <CohortTable
            cohorts={cohorts}
            chosenYear={chosen?.cohortYear ?? null}
          />
        </section>
        <FlowPanel />
      </div>
      {chosen && (
        <OpenCohort
          cohortYear={chosen.cohortYear}
          limit={limit}
          mayPrepare={mayPrepare}
          mayFix={mayFix}
          openGroupId={askedGroupId}
        />
      )}
    </>
  );
}
