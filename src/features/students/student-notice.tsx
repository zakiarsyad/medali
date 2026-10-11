"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import styles from "./new-students.module.css";

type Notify = (message: string | null) => void;

const NoticeContext = createContext<Notify>(() => {});

/** Sets the confirmation shown above the form and the list, or clears it. */
export function useNotify(): Notify {
  return useContext(NoticeContext);
}

/**
 * Shows the confirmation of the last add, change or removal above the form
 * and the list. It is kept here, not in the address, so that no name ends
 * up in an address, and not in a row, which is gone once it is removed.
 */
export function StudentNotice({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <NoticeContext value={setMessage}>
      {message && (
        <p className={styles.notice} role="status">
          {message}
        </p>
      )}
      {children}
    </NoticeContext>
  );
}
