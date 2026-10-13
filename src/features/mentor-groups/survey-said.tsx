"use client";

import {
  createContext,
  type ReactNode,
  use,
  useState,
  useTransition,
} from "react";
import { FormMessage } from "@/ui/form-message";
import styles from "./mentor-groups.module.css";

interface SurveySaid {
  /** Whether a change is on its way to the server, or its answer to the tab. */
  isSending: boolean;
  /** Sends a change, and holds every button of the panel until the tab shows it. */
  send: (change: () => Promise<void>) => void;
  /** Says what a change did when it took away the form or the card it was sent from. */
  announce: (words: string) => void;
}

const SurveySaidContext = createContext<SurveySaid | null>(null);

/**
 * Holds the panel of the survey period to one change at a time, so a
 * second press sends nothing while the first is on its way.
 *
 * Opening a period replaces the form by the card of the period, and
 * closing or cancelling it brings the form back: a message under the
 * button would go with it. What a change did is said here instead, above
 * whichever of the two shows, until the next change.
 */
export function SurveySaidAbove({ children }: { children: ReactNode }) {
  const [isSending, startSending] = useTransition();
  const [announced, announce] = useState<string | null>(null);

  function send(change: () => Promise<void>) {
    announce(null);
    startSending(change);
  }

  return (
    <SurveySaidContext value={{ isSending, send, announce }}>
      {announced !== null && (
        <div className={styles.said}>
          <FormMessage state={{ error: null, done: announced }} />
        </div>
      )}
      {children}
    </SurveySaidContext>
  );
}

export function useSurveySaid(): SurveySaid {
  const said = use(SurveySaidContext);
  if (said === null) {
    throw new Error("A control of the survey period stands outside its panel.");
  }
  return said;
}
