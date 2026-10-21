"use client";

import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import styles from "./discipline-penalties.module.css";
import {
  changePenaltyConditionAction,
  changePenaltyDecisionAction,
} from "./penalty-actions";
import type { PenaltyRow } from "./penalty-board";
import {
  allConditionsMet,
  hasConditions,
  isContinuationDecision,
  type PenaltyFollowUp,
} from "./penalty-follow-up";
import { useFollowUpSend } from "./penalty-follow-up-send";
import {
  CONTINUATION_CONDITIONS,
  CONTINUATION_DECISIONS,
  type ContinuationCondition,
} from "./penalty-ids";
import { CONTINUE_WHEN_ALL_MET, decisionQuestion } from "./penalty-messages";
import { CONDITION_WORDS, DECISION_WORDS } from "./penalty-words";

const HEADING = "Syarat melanjutkan studi (ayat 7)";

/** The conditions and Keputusan as a reader sees them, with nothing to press. */
function ReadOnlyConditions({ row }: { row: PenaltyRow }) {
  return (
    <section className={styles.conditions}>
      <h3 className={styles.conditionsHeading}>{HEADING}</h3>
      <ul className={styles.conditionList}>
        {CONTINUATION_CONDITIONS.map((condition) => (
          <li key={condition}>
            {row.conditionsMet.includes(condition)
              ? "Terpenuhi"
              : "Belum terpenuhi"}
            : {CONDITION_WORDS[condition]}
          </li>
        ))}
      </ul>
      <p className={styles.line}>
        <b>Keputusan:</b> {DECISION_WORDS[row.decision]}
      </p>
    </section>
  );
}

/**
 * The five ticks, each kept at once, and Keputusan, asked before it is
 * sent. Melanjutkan studi cannot be chosen until all five are ticked.
 */
function ConditionsForm({
  row,
  onFollowUp,
}: {
  row: PenaltyRow;
  onFollowUp: (next: PenaltyFollowUp) => void;
}) {
  const { message, pending, send } = useFollowUpSend(onFollowUp);
  const isAllMet = allConditionsMet(row.conditionsMet);

  function tick(condition: ContinuationCondition, met: boolean) {
    send(() => changePenaltyConditionAction(row.id, condition, met));
  }

  function decide(chosen: string) {
    if (!isContinuationDecision(chosen) || chosen === row.decision) return;
    if (!window.confirm(decisionQuestion(row.name, chosen))) return;
    send(() => changePenaltyDecisionAction(row.id, chosen));
  }

  return (
    <section className={styles.conditions}>
      <h3 className={styles.conditionsHeading}>{HEADING}</h3>
      <div className={styles.ticks}>
        {CONTINUATION_CONDITIONS.map((condition) => (
          <label key={condition} className={styles.tick}>
            <input
              type="checkbox"
              checked={row.conditionsMet.includes(condition)}
              disabled={pending}
              onChange={(event) => tick(condition, event.target.checked)}
            />
            <span>{CONDITION_WORDS[condition]}</span>
          </label>
        ))}
      </div>
      <label className={`${shared.field} ${styles.decision}`}>
        Keputusan
        <select
          className={`${shared.input} ${styles.control}`}
          value={row.decision}
          disabled={pending}
          onChange={(event) => decide(event.target.value)}
        >
          {CONTINUATION_DECISIONS.map((decision) => (
            <option
              key={decision}
              value={decision}
              disabled={decision === "continue" && !isAllMet}
            >
              {DECISION_WORDS[decision]}
            </option>
          ))}
        </select>
      </label>
      {!isAllMet && <p className={styles.note}>{CONTINUE_WHEN_ALL_MET}</p>}
      <FormMessage state={message} />
    </section>
  );
}

/**
 * Syarat melanjutkan studi (ayat 7) and Keputusan in "Rincian", only for
 * Berat jenjang pertama of a student with an Instansi asal: to change
 * for an account that follows up, to read for any other and for a
 * Ditetapkan penalty.
 */
export function PenaltyConditions({
  row,
  mayFollowUp,
  onFollowUp,
}: {
  row: PenaltyRow;
  mayFollowUp: boolean;
  onFollowUp: (next: PenaltyFollowUp) => void;
}) {
  if (!hasConditions(row)) return null;
  if (!mayFollowUp || row.status === "set") {
    return <ReadOnlyConditions row={row} />;
  }
  return <ConditionsForm row={row} onFollowUp={onFollowUp} />;
}
