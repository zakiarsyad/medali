"use client";

import shared from "@/ui/data-screen.module.css";
import { FormMessage } from "@/ui/form-message";
import styles from "./discipline-penalties.module.css";
import { changePenaltyStatusAction } from "./penalty-actions";
import { StatusBadge } from "./penalty-badges";
import {
  FOLLOW_UP_STATUSES,
  isFollowUpStatus,
  type PenaltyFollowUp,
} from "./penalty-follow-up";
import { useFollowUpSend } from "./penalty-follow-up-send";
import { statusQuestion } from "./penalty-messages";
import { STATUS_WORDS } from "./penalty-words";

/**
 * The status of a row: a choice of Dijatuhkan, Sedang dijalani and
 * Selesai dijalani for an account that follows up, asked before it is
 * sent; a label for a reader and for a Ditetapkan penalty, which never
 * changes.
 */
export function PenaltyStatusCell({
  id,
  name,
  followUp,
  mayFollowUp,
  onFollowUp,
}: {
  id: string;
  /** The student's name, for the question. */
  name: string;
  followUp: PenaltyFollowUp;
  mayFollowUp: boolean;
  onFollowUp: (next: PenaltyFollowUp) => void;
}) {
  const { message, pending, send } = useFollowUpSend(onFollowUp);
  const { status } = followUp;
  if (!mayFollowUp || status === "set") return <StatusBadge status={status} />;

  function choose(chosen: string) {
    if (!isFollowUpStatus(chosen) || chosen === status) return;
    if (!window.confirm(statusQuestion(name, chosen))) return;
    send(() => changePenaltyStatusAction(id, chosen));
  }

  return (
    <>
      <select
        className={`${shared.input} ${styles.control}`}
        aria-label="Status hukuman"
        value={status}
        disabled={pending}
        onChange={(event) => choose(event.target.value)}
      >
        {FOLLOW_UP_STATUSES.map((choice) => (
          <option key={choice} value={choice}>
            {STATUS_WORDS[choice]}
          </option>
        ))}
      </select>
      <FormMessage state={message} />
    </>
  );
}
