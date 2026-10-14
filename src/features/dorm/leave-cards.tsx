"use client";

import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./leave.module.css";
import { decideLeaveAction } from "./leave-actions";
import type { LeaveCard } from "./leave-card";
import { LeaveCardView } from "./leave-card-view";
import { DECISION_NOTE_MAX_LENGTH } from "./leave-ids";

/** What the server answered to the last decision made on a card. */
interface Answer {
  state: FormState;
  /** The status the card has since, when the decision was kept. */
  decided: "approved" | "rejected" | null;
}

/** Catatan, "Setujui" and "Tolak" on a card that waits. */
function LeaveDecide({
  id,
  onAnswer,
}: {
  id: string;
  onAnswer: (answer: Answer) => void;
}) {
  const [note, setNote] = useState("");
  const [pending, startSending] = useTransition();

  function send(decision: "approve" | "reject") {
    startSending(async () => {
      const state = await decideLeaveAction(id, decision, note);
      const status = decision === "approve" ? "approved" : "rejected";
      onAnswer({ state, decided: state.done ? status : null });
    });
  }

  return (
    <div className={styles.decide}>
      <input
        className={shared.input}
        aria-label="Catatan"
        placeholder="Catatan (wajib bila ditolak)"
        maxLength={DECISION_NOTE_MAX_LENGTH}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <button
        type="button"
        className={shared.button}
        disabled={pending}
        onClick={() => send("approve")}
      >
        Setujui
      </button>
      <button
        type="button"
        className={shared.quiet}
        disabled={pending}
        onClick={() => send("reject")}
      >
        Tolak
      </button>
    </div>
  );
}

/**
 * The request cards of one page, as they were read when the page opened:
 * a card decided here stays in its place with its new status and the
 * answer under it, also once the list it came from no longer holds it.
 * A card that waits offers Catatan, "Setujui" and "Tolak" to an account
 * that may decide. It is made anew for each address.
 */
export function LeaveCards({
  cards,
  mayDecide,
  emptyWords,
}: {
  cards: LeaveCard[];
  mayDecide: boolean;
  /** What is said when there is no card to show. */
  emptyWords: string;
}) {
  const [shown] = useState(cards);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  if (shown.length === 0) return <p className={shared.empty}>{emptyWords}</p>;
  return (
    <ul className={styles.cards}>
      {shown.map((card) => {
        const answer = answers[card.id];
        const decided = answer?.decided ?? null;
        const status = decided ?? card.status;
        return (
          <LeaveCardView
            key={card.id}
            card={decided === null ? card : { ...card, status, warnings: [] }}
          >
            {mayDecide && status === "submitted" && (
              <LeaveDecide
                id={card.id}
                onAnswer={(sent) =>
                  setAnswers((before) => ({ ...before, [card.id]: sent }))
                }
              />
            )}
            {answer && <FormMessage state={answer.state} />}
          </LeaveCardView>
        );
      })}
    </ul>
  );
}
