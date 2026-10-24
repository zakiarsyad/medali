import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { TabNote } from "@/ui/tabbed-head";
import type { ListedEvaluation } from "./evaluation-rows";
import { EvaluationTable } from "./evaluation-table";
import styles from "./mentor-groups.module.css";
import { ReplacementFlow } from "./replacement-flow";
import type { ListedReplacement } from "./replacement-rows";
import {
  type ReplacementRowRights,
  ReplacementTable,
} from "./replacement-table";

/**
 * What an account that only reads the tab "Evaluasi dan penggantian" is
 * told under the head, in place of the forms: who does the work.
 */
export function FormNote({ form }: { form: ReactNode | null }) {
  if (form !== null) return null;
  return (
    <TabNote>
      Evaluasi dan penggantian pengasuh dilakukan oleh Kepala Unit Pembangunan
      Karakter.
    </TabNote>
  );
}

/**
 * The top of the tab "Evaluasi dan penggantian": the panel with the forms
 * beside "Alur penggantian", or nothing for an account that only reads.
 */
export function FormArea({
  form,
}: {
  /** The panel with the forms, or null for an account that only reads. */
  form: ReactNode | null;
}) {
  if (form === null) return null;
  return (
    <div className={styles.sideBySide}>
      {form}
      <ReplacementFlow />
    </div>
  );
}

/** "Riwayat penggantian" and "Evaluasi terbaru", which every account of the tab reads. */
export function TabLists({
  replacements,
  rights,
  latest,
}: {
  replacements: ListedReplacement[];
  rights: ReplacementRowRights;
  latest: ListedEvaluation[];
}) {
  return (
    <>
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
