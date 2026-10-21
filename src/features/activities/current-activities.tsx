"use client";

import { useReducer, useTransition } from "react";
import type { ActivityCard } from "./activity-card";
import { cardsAfter, NO_CARD_OPEN } from "./cards-state";
import { CurrentActivitiesView } from "./current-activities-view";

/**
 * "Berlangsung dan masa unggah foto": a card for each running schedule.
 * It holds which card has its upload open and what the server last
 * answered; what follows from a press is decided apart from it, and so
 * is how the cards are drawn.
 */
export function CurrentActivities({ cards }: { cards: ActivityCard[] }) {
  const [state, tell] = useReducer(cardsAfter, NO_CARD_OPEN);
  // Every send runs in a transition held here, not in its card: a card
  // may close while its photo is on its way, and an answer that leads
  // the student elsewhere, as when they were signed out since, is
  // dropped when the part that started it has left the screen. Of two
  // sends on their way at once, only the later one's is sure to arrive.
  const [, startSend] = useTransition();
  return (
    <CurrentActivitiesView
      cards={cards}
      state={state}
      startSend={startSend}
      onOpen={(cardId) => tell({ kind: "opened", cardId })}
      onCancel={() => tell({ kind: "cancelled" })}
      onAnswer={(cardId, answer) =>
        tell({ kind: "answered", cardId, state: answer })
      }
      onRestart={(cardId) => tell({ kind: "restarted", cardId })}
    />
  );
}
