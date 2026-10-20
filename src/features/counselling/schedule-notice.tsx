"use client";

import { createContext, type ReactNode, use, useState } from "react";
import { FormMessage, type FormState } from "@/ui/form-message";

type Announce = (message: FormState | null) => void;

interface Notice {
  announced: FormState | null;
  announce: Announce;
}

const NoticeContext = createContext<Notice>({
  announced: null,
  announce: () => {},
});

/**
 * Holds what a press did when the page drawn again after it took its
 * card away, or gave the card anew, until the next press. Being a part
 * of the browser, it stays while the page is drawn again. It is cleared
 * when `clearOn` changes, such as the address it is shown at, while the
 * forms inside keep what was typed.
 */
export function ScheduleNotice({
  clearOn,
  children,
}: {
  clearOn: string;
  children: ReactNode;
}) {
  const [announced, announce] = useState<FormState | null>(null);
  const [clearedOn, setClearedOn] = useState(clearOn);
  if (clearedOn !== clearOn) {
    setClearedOn(clearOn);
    announce(null);
  }
  return (
    <NoticeContext value={{ announced, announce }}>{children}</NoticeContext>
  );
}

/** Says what `ScheduleNotice` holds, above the cards. */
export function ScheduleNoticeMessage() {
  const { announced } = use(NoticeContext);
  return announced === null ? null : <FormMessage state={announced} />;
}

/** Tells `ScheduleNotice` what to say, or null to say nothing. */
export function useScheduleNotice(): Announce {
  return use(NoticeContext).announce;
}
