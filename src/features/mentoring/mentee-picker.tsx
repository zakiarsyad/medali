"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { matchingMentees } from "./mentee-search";
import type { Mentee } from "./mentees";
import styles from "./mentoring.module.css";

/** How many matches are offered at once; typing more narrows them. */
const OFFERED_MAX = 8;

const SEARCH_WORDS = "Ketik nama atau NIM";

function Offered({
  query,
  found,
  onChoose,
}: {
  query: string;
  found: Mentee[];
  onChoose: (mentee: Mentee) => void;
}) {
  if (query.trim() === "") return null;
  if (found.length === 0) {
    return (
      <p className={shared.detail}>
        Tidak ada anak asuh aktif yang cocok. Hanya mahasiswa aktif dari
        kelompok yang Anda asuh saat ini yang dapat dipilih.
      </p>
    );
  }
  const hidden = found.length - OFFERED_MAX;
  return (
    <>
      <ul className={styles.offered}>
        {found.slice(0, OFFERED_MAX).map((mentee) => (
          <li key={mentee.id}>
            <button
              type="button"
              className={shared.quiet}
              onClick={() => onChoose(mentee)}
            >
              {mentee.name} · {mentee.nim}
            </button>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <p className={shared.detail}>
          {hidden.toLocaleString("id-ID")} lainnya cocok. Ketik lebih lengkap
          untuk mempersempit.
        </p>
      )}
    </>
  );
}

/**
 * "Mahasiswa" of the form: the mentor types a name or a NIM and picks one
 * of their own Aktif mentees. The one picked is sent as `studentId`.
 */
export function MenteePicker({
  mentees,
  chosen,
  onChoose,
}: {
  /** The students the mentor may write for. */
  mentees: Mentee[];
  chosen: Mentee | null;
  onChoose: (mentee: Mentee | null) => void;
}) {
  const [query, setQuery] = useState("");

  if (chosen !== null) {
    return (
      <div className={shared.field}>
        Mahasiswa
        <div className={shared.actions}>
          <input type="hidden" name="studentId" value={chosen.id} />
          <b className={styles.chosen}>
            {chosen.name} · {chosen.nim}
          </b>
          <button
            type="button"
            className={shared.quiet}
            onClick={() => onChoose(null)}
          >
            Ganti
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className={shared.field}>
      <label className={shared.field}>
        Mahasiswa
        <input
          type="search"
          className={shared.input}
          placeholder={SEARCH_WORDS}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
        />
      </label>
      <Offered
        query={query}
        found={matchingMentees(mentees, query)}
        onChoose={onChoose}
      />
    </div>
  );
}
