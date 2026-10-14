"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { SEARCH_TEXT_MAX, searchText } from "@/ui/search-text";
import { SEARCH_DELAY_MS } from "@/ui/use-found";
import {
  CHOICE_ORDER,
  CHOICE_WORDS,
  CHOICES,
  type ClarificationFilters,
  choiceNamed,
  clarificationListAddress,
} from "./clarification-address";

/**
 * "Cari nama atau NIM" and the status above the clarification cards.
 * Both are kept in the address of the page: a choice at once, and a
 * typed text after a pause in the typing, in place of the address before
 * it, so going back does not step through every letter.
 */
export function ClarificationFilterRow({
  filters,
}: {
  filters: ClarificationFilters;
}) {
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

  const { query: heldQuery, status } = filters;
  useEffect(() => {
    const query = searchText(typed) ?? "";
    if (query === heldQuery) return;
    const timer = setTimeout(() => {
      setAsked(query);
      router.replace(clarificationListAddress({ query, status }));
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [typed, heldQuery, status, router]);

  function choose(sent: string) {
    const query = searchText(typed) ?? "";
    router.push(clarificationListAddress({ query, status: choiceNamed(sent) }));
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
        value={CHOICES[status]}
        onChange={(event) => choose(event.target.value)}
      >
        {CHOICE_ORDER.map((choice) => (
          <option key={choice} value={CHOICES[choice]}>
            {CHOICE_WORDS[choice]}
          </option>
        ))}
      </select>
    </div>
  );
}
