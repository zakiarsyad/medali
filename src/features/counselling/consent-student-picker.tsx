"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { SEARCH_TEXT_MAX } from "@/ui/search-text";
import { useFound } from "@/ui/use-found";
import { searchConsentStudentsAction } from "./consent-actions";
import type { ConsentPick } from "./consent-picks";
import { NOBODY_FOUND } from "./consent-words";
import styles from "./counselling.module.css";

function Found({
  query,
  found,
  onPick,
}: {
  query: string;
  found: ConsentPick[];
  onPick: (pick: ConsentPick) => void;
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
 * A name or a NIM is typed, the server offers the students found, and
 * one is picked. The one picked stays until "Ganti mahasiswa".
 */
export function ConsentStudentPicker({
  picked,
  onPick,
  onClear,
  search = searchConsentStudentsAction,
}: {
  picked: ConsentPick | null;
  onPick: (pick: ConsentPick) => void;
  onClear: () => void;
  /** The action that finds the students, by the right of the panel. */
  search?: (query: string) => Promise<ConsentPick[]>;
}) {
  const [query, setQuery] = useState("");
  const found = useFound(query, search);

  if (picked) {
    return (
      <div className={styles.picked}>
        <span>
          <b>{picked.name}</b> · NIM {picked.nim} · {picked.program}
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
        placeholder="Ketik nama atau NIM mahasiswa"
        value={query}
        maxLength={SEARCH_TEXT_MAX}
        autoComplete="off"
        onChange={(event) => setQuery(event.target.value)}
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
