import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import shared from "@/ui/data-screen.module.css";
import { MentorsHead } from "@/ui/mentors-head";
import type { TabLinksProps } from "@/ui/tab-links";
import { EvaluationPanel } from "./evaluation-panel";
import { listLatestEvaluations } from "./evaluation-rows";
import { EvaluationTable } from "./evaluation-table";
import styles from "./mentor-groups.module.css";

/** The tab "Evaluasi dan penggantian". */
export async function EvaluationScreen({
  tabs,
  limit,
  evaluatedLimit,
  chosenGroupId,
}: {
  tabs: TabLinksProps;
  /** Which evaluations the account that opened the tab may see. */
  limit: RowLimit;
  /**
   * The groups the account may evaluate the mentor of, or null for an
   * account that only reads: it gets no form.
   */
  evaluatedLimit: RowLimit | null;
  /** The group the address asks the form for, if any. */
  chosenGroupId: string | null;
}) {
  const latest = await listLatestEvaluations(database(), limit);
  return (
    <>
      <MentorsHead tabs={tabs} />
      {evaluatedLimit === null ? (
        <p className={styles.note}>
          Evaluasi dan penggantian pengasuh dilakukan oleh Kepala Unit
          Pembangunan Karakter.
        </p>
      ) : (
        <EvaluationPanel limit={evaluatedLimit} chosenGroupId={chosenGroupId} />
      )}
      <section className={shared.panel}>
        <h2 className={shared.heading}>Evaluasi terbaru</h2>
        <EvaluationTable evaluations={latest} />
      </section>
    </>
  );
}
