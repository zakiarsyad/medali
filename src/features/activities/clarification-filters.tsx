"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { SEARCH_TEXT_MAX, searchText } from "@/ui/search-text";
import { SEARCH_DELAY_MS } from "@/ui/use-found";
import {
  CLARIFICATION_CHOICE_ORDER,
  CLARIFICATION_CHOICE_WORDS,
  CLARIFICATION_CHOICES,
  type ClarificationChoice,
  type ClarificationFilters,
  choiceNamed,
  clarificationListAddress,
} from "./clarification-list-address";

/** The search and the status choice as they are drawn for one state. */
export function ClarificationFiltersView({
  typed,
  status,
  onTyped,
  onStatus,
}: {
  typed: string;
  status: ClarificationChoice;
  onTyped: (typed: string) => void;
  onStatus: (status: ClarificationChoice) => void;
}) {
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
        onChange={(event) => onTyped(event.target.value)}
      />
      <select
        className={shared.input}
        aria-label="Status"
        value={CLARIFICATION_CHOICES[status]}
        onChange={(event) => onStatus(choiceNamed(event.target.value))}
      >
        {CLARIFICATION_CHOICE_ORDER.map((choice) => (
          <option key={choice} value={CLARIFICATION_CHOICES[choice]}>
            {CLARIFICATION_CHOICE_WORDS[choice]}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * "Cari nama atau NIM" and the status choice above the clarification
 * cards. Both are kept in the address of the page: a status at once, and
 * a typed text after a pause in the typing, in place of the address
 * before it, so going back does not step through every letter.
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

  return (
    <ClarificationFiltersView
      typed={typed}
      status={status}
      onTyped={setTyped}
      onStatus={(chosen) =>
        router.push(
          clarificationListAddress({
            query: searchText(typed) ?? "",
            status: chosen,
          }),
        )
      }
    />
  );
}
