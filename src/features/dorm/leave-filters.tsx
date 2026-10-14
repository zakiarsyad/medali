"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { SEARCH_TEXT_MAX, searchText } from "@/ui/search-text";
import { SEARCH_DELAY_MS } from "@/ui/use-found";
import {
  KIND_CHOICE_ORDER,
  KIND_CHOICE_WORDS,
  KIND_CHOICES,
  kindNamed,
  type LeaveFilters,
  leaveListAddress,
  STATUS_CHOICE_ORDER,
  STATUS_CHOICE_WORDS,
  STATUS_CHOICES,
  statusNamed,
} from "./leave-address";

/**
 * "Cari nama atau NIM", the status and the kind above the request cards.
 * All are kept in the address of the page: a choice at once, and a typed
 * text after a pause in the typing, in place of the address before it,
 * so going back does not step through every letter.
 */
export function LeaveFilterRow({ filters }: { filters: LeaveFilters }) {
  const router = useRouter();
  const [typed, setTyped] = useState(filters.query);
  /** The text the address was last asked to hold by the typing here. */
  const [asked, setAsked] = useState(filters.query);
  const [held, setHeld] = useState(filters.query);

  // The address changed. When that was not the typing here, as on going
  // back, the field shows what the address holds; the answer to an
  // earlier text must not replace a later one that is still being typed.
  if (held !== filters.query) {
    setHeld(filters.query);
    if (filters.query !== asked) setTyped(filters.query);
  }

  const { query: heldQuery, status, kind } = filters;
  useEffect(() => {
    const query = searchText(typed) ?? "";
    if (query === heldQuery) return;
    const timer = setTimeout(() => {
      setAsked(query);
      router.replace(leaveListAddress({ query, status, kind }));
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [typed, heldQuery, status, kind, router]);

  function choose(chosen: Partial<LeaveFilters>) {
    const query = searchText(typed) ?? "";
    router.push(leaveListAddress({ query, status, kind, ...chosen }));
  }

  return (
    <div className={shared.filters}>
      <input
        type="search"
        className={shared.input}
        placeholder="Cari nama atau NIM"
        aria-label="Cari nama atau NIM"
        value={typed}
        maxLength={SEARCH_TEXT_MAX}
        autoComplete="off"
        onChange={(event) => setTyped(event.target.value)}
      />
      <select
        className={shared.input}
        aria-label="Status"
        value={STATUS_CHOICES[status]}
        onChange={(event) =>
          choose({ status: statusNamed(event.target.value) })
        }
      >
        {STATUS_CHOICE_ORDER.map((choice) => (
          <option key={choice} value={STATUS_CHOICES[choice]}>
            {STATUS_CHOICE_WORDS[choice]}
          </option>
        ))}
      </select>
      <select
        className={shared.input}
        aria-label="Jenis"
        value={KIND_CHOICES[kind]}
        onChange={(event) => choose({ kind: kindNamed(event.target.value) })}
      >
        {KIND_CHOICE_ORDER.map((choice) => (
          <option key={choice} value={KIND_CHOICES[choice]}>
            {KIND_CHOICE_WORDS[choice]}
          </option>
        ))}
      </select>
    </div>
  );
}
