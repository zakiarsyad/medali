"use client";

import { useState } from "react";
import { FormMessage, type FormState } from "@/ui/form-message";
import type { RequestCard } from "./request-board";
import { RequestCardView } from "./request-card-view";
import { RequestDecide } from "./request-decide";
import styles from "./siku.module.css";

const START: FormState = { error: null, done: null };

/**
 * The request cards of one page of the staff panel. A card that waits
 * offers Poin, "Catatan penilai", "Setujui" and "Tolak" to an account
 * that may decide. The answer to a decision stays above the cards, since
 * a decided card leaves the list of those that wait.
 */
export function RequestCards({
  cards,
  mayDecide,
}: {
  cards: readonly RequestCard[];
  mayDecide: boolean;
}) {
  const [answer, setAnswer] = useState(START);
  return (
    <>
      <FormMessage state={answer} />
      <div className={styles.cards}>
        {cards.map((card) => (
          <RequestCardView key={card.id} card={card}>
            {mayDecide && card.status === "waiting" && (
              <RequestDecide
                requestId={card.id}
                name={card.name}
                onAnswer={setAnswer}
              />
            )}
          </RequestCardView>
        ))}
      </div>
    </>
  );
}
