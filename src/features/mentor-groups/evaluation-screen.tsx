import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import { MentorsHead } from "@/ui/mentors-head";
import type { TabLinksProps } from "@/ui/tab-links";
import type { FormPart } from "./evaluation-address";
import { listLatestEvaluations } from "./evaluation-rows";
import { FormArea, FormNote, TabLists } from "./evaluation-tab";
import { FormPanel } from "./form-panel";
import { type FormLimits, openPart } from "./form-parts";
import { listReplacements } from "./replacement-rows";
import type { ReplacementRowRights } from "./replacement-table";

/** Reads "Riwayat penggantian" and "Evaluasi terbaru" at the same time. */
async function StoredLists({
  limit,
  rights,
}: {
  limit: RowLimit;
  rights: ReplacementRowRights;
}) {
  const db = database();
  const [latest, replacements] = await Promise.all([
    listLatestEvaluations(db, limit),
    listReplacements(db, limit),
  ]);
  return (
    <TabLists replacements={replacements} rights={rights} latest={latest} />
  );
}

/**
 * The tab "Evaluasi dan penggantian". The form and the lists under it
 * each read what they show, so neither waits for the other.
 */
export function EvaluationScreen({
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
  const part = openPart(chosenPart, formLimits);
  const rights = { groupLimit, mayCancel: formLimits.replacement !== null };
  const form =
    part === null ? null : (
      <FormPanel
        limits={formLimits}
        part={part}
        chosenGroupId={chosenGroupId}
        savedPeriodId={savedPeriodId}
      />
    );
  return (
    <>
      <MentorsHead tabs={tabs}>
        <FormNote form={form} />
      </MentorsHead>
      <FormArea form={form} />
      <StoredLists limit={limit} rights={rights} />
    </>
  );
}
