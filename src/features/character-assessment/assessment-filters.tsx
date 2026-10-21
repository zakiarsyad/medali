"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { SEARCH_TEXT_MAX, searchText } from "@/ui/search-text";
import { SEARCH_DELAY_MS } from "@/ui/use-found";
import {
  ASSESSMENT_FILTERS,
  type AssessmentParams,
  assessmentAddress,
  FILTER_CHOICES,
  FILTER_WORDS,
  filterNamed,
  START_PARAMS,
} from "./assessment-address";

/**
 * "Cari nama atau NIM" and the filter above "Hasil asesmen karakter".
 * Both are kept in the address of the page: a choice at once, and a
 * typed text after a pause in the typing, in place of the address before
 * it, so going back does not step through every letter. Either starts
 * the list again at its first page.
 */
export function AssessmentFilterRow({ params }: { params: AssessmentParams }) {
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

  const { query: heldQuery, filter, coachingAll, coachingPage } = params;
  useEffect(() => {
    const query = searchText(typed) ?? "";
    if (query === heldQuery) return;
    const timer = setTimeout(() => {
      setAsked(query);
      const kept = { ...START_PARAMS, filter, coachingAll, coachingPage };
      router.replace(assessmentAddress({ ...kept, query }), { scroll: false });
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [typed, heldQuery, filter, coachingAll, coachingPage, router]);

  function choose(sent: string) {
    const query = searchText(typed) ?? "";
    const chosen = {
      query,
      filter: filterNamed(sent),
      coachingAll,
      coachingPage,
    };
    router.push(assessmentAddress({ ...START_PARAMS, ...chosen }), {
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
        {ASSESSMENT_FILTERS.map((each) => (
          <option key={each} value={FILTER_CHOICES[each]}>
            {FILTER_WORDS[each]}
          </option>
        ))}
      </select>
    </div>
  );
}
