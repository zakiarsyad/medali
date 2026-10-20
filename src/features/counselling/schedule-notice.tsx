"use client";

import { createContext, type ReactNode, use, useState } from "react";
import { FormMessage, type FormState } from "@/ui/form-message";
import type { ScheduleSession } from "./session-view";

type Announce = (message: FormState | null) => void;

type ShowSession = (session: ScheduleSession) => void;

/** What a press opened no session for. */
export const NO_SESSION: ScheduleSession = { kind: "none" };

interface Notice {
  announced: FormState | null;
  announce: Announce;
  session: ScheduleSession;
  showSession: ShowSession;
}

const NoticeContext = createContext<Notice>({
  announced: null,
  announce: () => {},
  session: NO_SESSION,
  showSession: () => {},
});

/**
 * Holds what a press did when the page drawn again after it took its
 * card away, or gave the card anew, until the next press: its message,
 * and the session "Tandai selesai" opened. Being a part of the browser,
 * it stays while the page is drawn again. It is cleared when `clearOn`
 * changes, such as the address it is shown at, while the forms inside
 * keep what was typed.
 */
export function ScheduleNotice({
  clearOn,
  children,
}: {
  clearOn: string;
  children: ReactNode;
}) {
  const [announced, announce] = useState<FormState | null>(null);
  const [session, showSession] = useState<ScheduleSession>(NO_SESSION);
  const [clearedOn, setClearedOn] = useState(clearOn);
  if (clearedOn !== clearOn) {
    setClearedOn(clearOn);
    announce(null);
    showSession(NO_SESSION);
  }
  return (
    <NoticeContext value={{ announced, announce, session, showSession }}>
      {children}
    </NoticeContext>
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

/** The session "Tandai selesai" opened, and a way to open another. */
export function useScheduleSession(): [ScheduleSession, ShowSession] {
  const { session, showSession } = use(NoticeContext);
  return [session, showSession];
}
