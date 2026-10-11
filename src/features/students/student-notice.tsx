"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./new-students.module.css";
import { addressOf } from "./new-students-address";

/**
 * Sets the confirmation shown above the form and the list, or clears it
 * with null. `address` is where the screen goes next, when the sender
 * leaves the address it is on; the confirmation then stays for that one.
 */
type Notify = (message: string | null, address?: string) => void;

interface Notice {
  message: string;
  /** The address the confirmation belongs to. It goes when that is left. */
  address: string;
}

const NoticeContext = createContext<Notify>(() => {});

export function useNotify(): Notify {
  return useContext(NoticeContext);
}

/**
 * Shows the confirmation of the last add, change or removal above the form
 * and the list. It is kept here, not in the address, so that no name ends
 * up in an address, and not in a row, which is gone once it is removed.
 */
export function StudentNotice({ children }: { children: ReactNode }) {
  const here = addressOf(usePathname(), useSearchParams().toString());
  const [notice, setNotice] = useState<Notice | null>(null);
  const shown = useRef<HTMLParagraphElement>(null);

  function notify(message: string | null, address = here) {
    setNotice(message === null ? null : { message, address });
  }

  // A search, Ubah or Batal changes the address: the confirmation of
  // earlier work no longer belongs there.
  useEffect(() => {
    setNotice((kept) => (kept && kept.address !== here ? null : kept));
  }, [here]);

  // Hapus is pressed in the list, below where the confirmation shows.
  useEffect(() => {
    if (notice) shown.current?.scrollIntoView({ block: "center" });
  }, [notice]);

  return (
    <NoticeContext value={notify}>
      {notice && (
        <p ref={shown} className={styles.notice} role="status">
          {notice.message}
        </p>
      )}
      {children}
    </NoticeContext>
  );
}
