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
import { listReplacements } from "./replacement-rows";
import { ReplacementTable } from "./replacement-table";

/** The tab "Evaluasi dan penggantian". */
export async function EvaluationScreen({
  tabs,
  limit,
  groupLimit,
  formLimits,
  chosenPart,
  chosenGroupId,
  savedPeriodId,
}: {
  tabs: TabLinksProps;
  /**
   * The groups whose evaluations and replacements the account that opened
   * the tab may see.
   */
  limit: RowLimit;
  /** The groups whose page the account may open, or null for none. */
  groupLimit: RowLimit | null;
  /**
   * The groups the account may evaluate and may replace the mentor of. An
   * account that only reads has neither: it gets no form.
   */
  formLimits: FormLimits;
  /** The form the address asks for. */
  chosenPart: FormPart;
  /** The group the address asks the form for, if any. */
  chosenGroupId: string | null;
  /** The period of the evaluation whose saving opened the form, if any. */
  savedPeriodId: string | null;
}) {
  const db = database();
  const [latest, replacements] = await Promise.all([
    listLatestEvaluations(db, limit),
    listReplacements(db, limit),
  ]);
  const part = openPart(chosenPart, formLimits);
  const rights = { groupLimit, mayCancel: formLimits.replacement !== null };
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
            savedPeriodId={savedPeriodId}
          />
          <ReplacementFlow />
        </div>
      )}
      <section className={shared.panel}>
        <h2 className={shared.heading}>Riwayat penggantian</h2>
        <ReplacementTable replacements={replacements} rights={rights} />
      </section>
      <section className={shared.panel}>
        <h2 className={shared.heading}>Evaluasi terbaru</h2>
        <EvaluationTable evaluations={latest} />
      </section>
    </>
  );
}
