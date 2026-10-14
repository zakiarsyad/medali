"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { SEARCH_TEXT_MAX, searchText } from "@/ui/search-text";
import { SEARCH_DELAY_MS } from "@/ui/use-found";
import {
  FILTER_CHOICES,
  FILTER_WORDS,
  filterNamed,
  SIKU_FILTERS,
  type SikuParams,
  sikuAddress,
} from "./siku-address";

/**
 * "Cari nama atau NIM" and the filter above "Daftar nilai SIKU". Both are
 * kept in the address of the page, with the rest of what it holds: a
 * choice at once, and a typed text after a pause in the typing, in place
 * of the address before it, so going back does not step through every
 * letter. Either starts the list again at its first page.
 */
export function SikuFilterRow({ params }: { params: SikuParams }) {
  const router = useRouter();
  const [typed, setTyped] = useState(params.query);
  /** The text the address was last asked to hold by the typing here. */
  const [asked, setAsked] = useState(params.query);
  const [held, setHeld] = useState(params.query);

  // The address changed. When that was not the typing here, as on going
  // back, the field shows what the address holds; the answer to an
  // earlier text must not replace a later one that is still being typed.
  if (held !== params.query) {
    setHeld(params.query);
    if (params.query !== asked) setTyped(params.query);
  }

  const { query: heldQuery, filter, allFalls, allRises } = params;
  useEffect(() => {
    const query = searchText(typed) ?? "";
    if (query === heldQuery) return;
    const timer = setTimeout(() => {
      setAsked(query);
      const kept = { filter, allFalls, allRises };
      router.replace(sikuAddress({ ...kept, query, page: 1 }), {
        scroll: false,
      });
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [typed, heldQuery, filter, allFalls, allRises, router]);

  function choose(sent: string) {
    const query = searchText(typed) ?? "";
    const chosen = filterNamed(sent);
    router.push(sikuAddress({ ...params, query, filter: chosen, page: 1 }), {
      scroll: false,
    });
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
        aria-label="Filter"
        value={FILTER_CHOICES[filter]}
        onChange={(event) => choose(event.target.value)}
      >
        {SIKU_FILTERS.map((each) => (
          <option key={each} value={FILTER_CHOICES[each]}>
            {FILTER_WORDS[each]}
          </option>
        ))}
      </select>
    </div>
  );
}
