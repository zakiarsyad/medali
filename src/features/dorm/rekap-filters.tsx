"use client";

import { useEffect, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { usePageMove } from "@/ui/page-move";
import { SEARCH_TEXT_MAX, searchText } from "@/ui/search-text";
import { SEARCH_DELAY_MS } from "@/ui/use-found";
import {
  type StaffViolationParams,
  staffViolationsAddress,
} from "./violation-address";

/** A semester the rekap can show, as the choice names it. */
export interface SemesterChoice {
  id: string;
  title: string;
}

/**
 * "Cari nama atau NIM" and the semester above the rekap. Both are kept in
 * the address of the page: a choice at once, and a typed text after a
 * pause in the typing, in place of the address before it, so going back
 * does not step through every letter. Either starts the rekap again at
 * its first page.
 */
export function RekapFilterRow({
  params,
  semesters,
  shownSemester,
}: {
  params: StaffViolationParams;
  semesters: SemesterChoice[];
  /** The semester the rekap shows, or null while no period is stored. */
  shownSemester: string | null;
}) {
  const router = usePageMove();
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

  useEffect(() => {
    const query = searchText(typed) ?? "";
    if (query === params.query) return;
    const timer = setTimeout(() => {
      setAsked(query);
      const next = { ...params, query, page: 1, studentId: null };
      router.replace(staffViolationsAddress(next), { scroll: false });
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [typed, params, router]);

  function choose(periodId: string) {
    const query = searchText(typed) ?? "";
    const next = { ...params, periodId, query, page: 1, studentId: null };
    router.push(staffViolationsAddress(next), { scroll: false });
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
      {shownSemester !== null && (
        <select
          className={shared.input}
          aria-label="Semester"
          value={shownSemester}
          onChange={(event) => choose(event.target.value)}
        >
          {semesters.map((each) => (
            <option key={each.id} value={each.id}>
              {each.title}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
