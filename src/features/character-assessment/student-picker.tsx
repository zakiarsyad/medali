"use client";

import { type KeyboardEvent, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { SEARCH_TEXT_MAX } from "@/ui/search-text";
import { useFound } from "@/ui/use-found";
import { searchAssessmentStudentsAction } from "./assessment-actions";
import type { AssessmentPick } from "./assessment-picks";
import styles from "./character-assessment.module.css";

export const NOBODY_FOUND = "Tidak ada mahasiswa aktif yang cocok.";

/**
 * The search box sits inside the form, where Enter would send the whole
 * assessment while the person only means to search.
 */
function keepFormOnEnter(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter") event.preventDefault();
}

function Found({
  query,
  found,
  onPick,
}: {
  query: string;
  found: AssessmentPick[];
  onPick: (pick: AssessmentPick) => void;
}) {
  if (query.trim() === "") return null;
  if (found.length === 0) {
    return <p className={shared.detail}>{NOBODY_FOUND}</p>;
  }
  return (
    <div className={styles.found}>
      {found.map((pick) => (
        <button
          key={pick.id}
          type="button"
          className={shared.quiet}
          onClick={() => onPick(pick)}
        >
          {pick.name} · NIM {pick.nim} · {pick.program}
        </button>
      ))}
    </div>
  );
}

/**
 * "Mahasiswa" of the form: a name or a NIM is typed, the server offers
 * the Aktif students found, and one is picked. The one picked stays
 * until "Ganti mahasiswa".
 */
export function StudentPicker({
  picked,
  onPick,
  onClear,
}: {
  picked: AssessmentPick | null;
  onPick: (pick: AssessmentPick) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const found = useFound(query, searchAssessmentStudentsAction);

  if (picked) {
    return (
      <div className={styles.picked}>
        <span>
          <b className={shared.typed}>{picked.name}</b> · NIM {picked.nim} ·{" "}
          {picked.program}
        </span>
        <button type="button" className={shared.link} onClick={onClear}>
          Ganti mahasiswa
        </button>
      </div>
    );
  }
  return (
    <div>
      <input
        type="search"
        className={shared.input}
        aria-label="Cari mahasiswa"
        placeholder="Ketik nama atau NIM mahasiswa aktif"
        value={query}
        maxLength={SEARCH_TEXT_MAX}
        autoComplete="off"
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={keepFormOnEnter}
      />
      <Found
        query={query}
        found={found}
        onPick={(pick) => {
          setQuery("");
          onPick(pick);
        }}
      />
    </div>
  );
}
