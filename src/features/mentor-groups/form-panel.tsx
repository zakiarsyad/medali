import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import { AutoSubmitForm } from "@/ui/auto-submit-form";
import shared from "@/ui/data-screen.module.css";
import {
  CHOSEN_PART_PARAM,
  EVALUATION_ADDRESS,
  FORM_PARTS,
  type FormPart,
  REPLACEMENT_PART_WORD,
} from "./evaluation-address";
import { listEvaluationChoices } from "./evaluation-choices";
import { EvaluationPart } from "./evaluation-panel";
import { FAIR_FROM } from "./evaluation-result";
import { FormPartLinks } from "./form-part-links";
import type { FormLimits } from "./form-parts";
import { GroupChoice } from "./group-choice";
import styles from "./mentor-groups.module.css";
import { ReplacementPart } from "./replacement-panel";

const HEADINGS: Record<FormPart, string> = {
  evaluation: "Evaluasi pengasuh",
  replacement: "Ganti pengasuh",
};

function PartBody({
  part,
  limit,
  chosenGroupId,
}: {
  part: FormPart;
  limit: RowLimit;
  chosenGroupId: string | null;
}) {
  if (part === "replacement") {
    return <ReplacementPart limit={limit} chosenGroupId={chosenGroupId} />;
  }
  return <EvaluationPart limit={limit} chosenGroupId={chosenGroupId} />;
}

/**
 * The panel with the two forms of the tab: the switch between them, the
 * choice of a group, and the form that is open. Only for an account that
 * may use a form; `limits` holds the groups it may use each one for.
 */
export async function FormPanel({
  limits,
  part,
  chosenGroupId,
}: {
  limits: FormLimits;
  /** The form that is open: one the account may use. */
  part: FormPart;
  /** The group the address asks for, if any. */
  chosenGroupId: string | null;
}) {
  const limit = limits[part];
  if (limit === null) return null;
  const choices = await listEvaluationChoices(database(), limit);
  // An id that names no group the account may choose counts as not asked.
  const isOffered = choices.some((choice) => choice.id === chosenGroupId);
  const groupId = isOffered ? chosenGroupId : null;
  return (
    <section className={shared.panel}>
      <div className={styles.panelHead}>
        <h2 className={shared.heading}>{HEADINGS[part]}</h2>
        <FormPartLinks
          offered={FORM_PARTS.filter((one) => limits[one] !== null)}
          open={part}
          chosenGroupId={groupId}
        />
      </div>
      {part === "evaluation" && (
        <p className={styles.quiet}>
          Kepala UPK menilai pengasuh setiap periode. Hasil kurang (di bawah{" "}
          {FAIR_FROM}) menjadi dasar penggantian.
        </p>
      )}
      {/* Made anew for each address, so the choice shows what the address holds. */}
      <AutoSubmitForm key={`${part} ${groupId}`} action={EVALUATION_ADDRESS}>
        {part === "replacement" && (
          <input
            type="hidden"
            name={CHOSEN_PART_PARAM}
            value={REPLACEMENT_PART_WORD}
          />
        )}
        <GroupChoice choices={choices} chosenId={groupId} />
      </AutoSubmitForm>
      <PartBody part={part} limit={limit} chosenGroupId={groupId} />
    </section>
  );
}
