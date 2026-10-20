"use client";

import { createContext, type ReactNode, use, useState } from "react";
import { FormMessage, type FormState } from "@/ui/form-message";

type Announce = (message: FormState | null) => void;

const NoticeContext = createContext<Announce>(() => {});

/**
 * Says what a press did when the page drawn again after it took its card
 * away, or gave the card anew: above the cards, until the next press.
 * Being a part of the browser, it stays while the page is drawn again.
 */
export function ScheduleNotice({ children }: { children: ReactNode }) {
  const [announced, announce] = useState<FormState | null>(null);
  return (
    <NoticeContext value={announce}>
      {announced !== null && <FormMessage state={announced} />}
      {children}
    </NoticeContext>
  );
}

/** Tells `ScheduleNotice` what to say, or null to say nothing. */
export function useScheduleNotice(): Announce {
  return use(NoticeContext);
}
