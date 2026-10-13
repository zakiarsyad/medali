import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import shared from "@/ui/data-screen.module.css";
import { MentorsHead } from "@/ui/mentors-head";
import type { TabLinksProps } from "@/ui/tab-links";
import type { FormPart } from "./evaluation-address";
import { listLatestEvaluations } from "./evaluation-rows";
import { EvaluationTable } from "./evaluation-table";
import { FormPanel } from "./form-panel";
import { type FormLimits, openPart } from "./form-parts";
import styles from "./mentor-groups.module.css";
import { ReplacementFlow } from "./replacement-flow";

/** The tab "Evaluasi dan penggantian". */
export async function EvaluationScreen({
  tabs,
  limit,
  formLimits,
  chosenPart,
  chosenGroupId,
}: {
  tabs: TabLinksProps;
  /** Which evaluations the account that opened the tab may see. */
  limit: RowLimit;
  /**
   * The groups the account may evaluate and may replace the mentor of. An
   * account that only reads has neither: it gets no form.
   */
  formLimits: FormLimits;
  /** The form the address asks for. */
  chosenPart: FormPart;
  /** The group the address asks the form for, if any. */
  chosenGroupId: string | null;
}) {
  const latest = await listLatestEvaluations(database(), limit);
  const part = openPart(chosenPart, formLimits);
  return (
    <>
      <MentorsHead tabs={tabs} />
      {part === null ? (
        <p className={styles.note}>
          Evaluasi dan penggantian pengasuh dilakukan oleh Kepala Unit
          Pembangunan Karakter.
        </p>
      ) : (
        <div className={styles.sideBySide}>
          <FormPanel
            limits={formLimits}
            part={part}
            chosenGroupId={chosenGroupId}
          />
          <ReplacementFlow />
        </div>
      )}
      <section className={shared.panel}>
        <h2 className={shared.heading}>Evaluasi terbaru</h2>
        <EvaluationTable evaluations={latest} />
      </section>
    </>
  );
}
