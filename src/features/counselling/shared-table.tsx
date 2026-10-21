"use client";

import { useState, useTransition } from "react";
import type { Parsed } from "@/parsed";
import shared from "@/ui/data-screen.module.css";
import { DAY } from "@/ui/day";
import styles from "./counselling.module.css";
import { LevelBadges } from "./screening-badges";
import { openSharedDetailAction } from "./shared-actions";
import { SharedDetailBox } from "./shared-detail-box";
import type { SharedDetail, SharedRow } from "./shared-view";
import {
  LEVEL_NOT_SHARED,
  NOT_SCREENED,
  sharedPartsLine,
} from "./shared-words";

/** How many columns the list has, for the row of "Rincian". */
const SHARED_COLUMNS = 6;

/** "Tingkat": the level when shared, else why there is none. */
function SharedLevel({ row }: { row: SharedRow }) {
  if (!row.data.includes("level")) {
    return <span className={styles.sub}>{LEVEL_NOT_SHARED}</span>;
  }
  if (row.level === null) {
    return <span className={styles.sub}>{NOT_SCREENED}</span>;
  }
  return <LevelBadges level={row.level} risk={false} />;
}

/**
 * One student of "Data yang dipublikasikan untuk Anda". "Rincian" asks
 * the server each time it is opened, so each opening is logged and a
 * sharing withdrawn since is refused.
 */
function SharedListRow({ row }: { row: SharedRow }) {
  const [opened, setOpened] = useState<Parsed<SharedDetail> | null>(null);
  const [pending, startOpening] = useTransition();
  const isOpen = opened !== null || pending;

  function toggle() {
    if (isOpen) {
      setOpened(null);
      return;
    }
    startOpening(async () => {
      setOpened(await openSharedDetailAction(row.studentId));
    });
  }

  return (
    <>
      <tr>
        <td className={shared.rowHeading} data-title="Mahasiswa">
          <b className={shared.typed}>{row.name}</b>
          <small className={shared.detail}>
            {row.nim} · {row.program}
          </small>
        </td>
        <td data-title="Pengasuh">{row.mentorName ?? "-"}</td>
        <td data-title="Tingkat">
          <SharedLevel row={row} />
        </td>
        <td data-title="Data yang dibagikan">{sharedPartsLine(row.data)}</td>
        <td data-title="Dipublikasikan">{DAY.format(row.publishedAt)}</td>
        <td className={shared.rowActions}>
          <button
            type="button"
            className={shared.link}
            aria-expanded={isOpen}
            disabled={pending}
            onClick={toggle}
          >
            {isOpen ? "Tutup" : "Rincian"}
          </button>
        </td>
      </tr>
      {opened && (
        <tr>
          <td colSpan={SHARED_COLUMNS}>
            {opened.ok ? (
              <SharedDetailBox detail={opened.value} />
            ) : (
              <p className={shared.error}>{opened.error}</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

/** The rows of "Data yang dipublikasikan untuk Anda"; on a phone each student is a card. */
export function SharedTable({ rows }: { rows: SharedRow[] }) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Pengasuh</th>
            <th>Tingkat</th>
            <th>Data yang dibagikan</th>
            <th>Dipublikasikan</th>
            <th>
              <span className={shared.hidden}>Rincian</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <SharedListRow key={row.studentId} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
