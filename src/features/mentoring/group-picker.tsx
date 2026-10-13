"use client";

import Link from "next/link";
import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { choiceWords, type GroupChoice, matchingGroups } from "./group-search";
import { meetingsAddress } from "./meetings-address";
import styles from "./mentoring.module.css";

/** How many groups are offered at once; typing more narrows them. */
const OFFERED_MAX = 8;

function Offered({ found }: { found: GroupChoice[] }) {
  if (found.length === 0) {
    return (
      <p className={shared.detail}>
        Tidak ada kelompok yang cocok. Ketik kode kelompok atau nama pengasuh.
      </p>
    );
  }
  const hidden = found.length - OFFERED_MAX;
  return (
    <>
      <ul className={styles.offered}>
        {found.slice(0, OFFERED_MAX).map((group) => (
          <li key={group.id}>
            <Link href={meetingsAddress(group.id)} className={shared.quiet}>
              {choiceWords(group)}
            </Link>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <p className={shared.detail}>
          {hidden.toLocaleString("id-ID")} kelompok lainnya cocok. Ketik lebih
          lengkap untuk mempersempit.
        </p>
      )}
    </>
  );
}

/**
 * "Kelompok pengasuhan": names the group the tab shows. "Ganti" opens a
 * search by code or mentor name, and choosing a group opens the tab for
 * it. Made anew for each group shown, so the search closes once a group
 * is chosen.
 */
export function GroupPicker({
  groups,
  chosen,
}: {
  /** The groups the account may read, the one shown among them. */
  groups: GroupChoice[];
  chosen: GroupChoice;
}) {
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState("");

  if (!isSearching) {
    return (
      <div className={`${shared.field} ${styles.picker}`}>
        Kelompok pengasuhan
        <div className={shared.actions}>
          <b className={styles.chosen}>{choiceWords(chosen)}</b>
          <button
            type="button"
            className={shared.quiet}
            onClick={() => setIsSearching(true)}
          >
            Ganti
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className={`${shared.field} ${styles.picker}`}>
      <label className={shared.field}>
        Kelompok pengasuhan
        <input
          type="search"
          className={`${shared.input} ${styles.fit}`}
          placeholder="Ketik kode kelompok atau nama pengasuh"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
        />
      </label>
      <Offered found={matchingGroups(groups, query)} />
      <div className={shared.actions}>
        <button
          type="button"
          className={shared.quiet}
          onClick={() => setIsSearching(false)}
        >
          Batal
        </button>
      </div>
    </div>
  );
}
