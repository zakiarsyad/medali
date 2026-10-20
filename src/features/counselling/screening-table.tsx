"use client";

import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { ConsentBadge } from "./consent-badge";
import { openScreeningDetailAction } from "./screening-actions";
import { LevelBadges } from "./screening-badges";
import { ScreeningHistory } from "./screening-history";
import type { ScreeningDetailItem, ScreeningRow } from "./screening-view";
import { INSTRUMENT_WORDS } from "./screening-words";

/** How many columns "Daftar mahasiswa" has, for the row of "Rincian". */
const SCREENING_COLUMNS = 6;

export const DETAIL_GONE =
  "Rincian tidak dapat dibuka. Muat ulang halaman, lalu coba lagi.";

/**
 * One screened student of "Daftar mahasiswa". "Rincian" asks the server
 * for every screening each time it is opened, so each opening is logged.
 */
function ScreeningListRow({ row }: { row: ScreeningRow }) {
  const [opened, setOpened] = useState<ScreeningDetailItem[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startOpening] = useTransition();

  function toggle() {
    if (isOpen) {
      setIsOpen(false);
      setOpened(null);
      return;
    }
    setIsOpen(true);
    startOpening(async () => {
      setOpened(await openScreeningDetailAction(row.studentId));
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
        <td data-title="Asesmen terakhir">
          {INSTRUMENT_WORDS[row.instrument]}, {shownDay(row.screenedOn)}
        </td>
        <td data-title="Tingkat">
          <LevelBadges level={row.level} risk={row.risk} />
        </td>
        <td data-title="Persetujuan">
          <ConsentBadge status={row.consent} />
        </td>
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
      {isOpen && !pending && (
        <tr>
          <td colSpan={SCREENING_COLUMNS}>
            {opened === null ? (
              <p className={shared.error}>{DETAIL_GONE}</p>
            ) : (
              <ScreeningHistory items={opened} />
            )}
          </td>
        </tr>
      )}
    </>
  );
}

/** The rows of "Daftar mahasiswa"; on a phone each student is a card. */
export function ScreeningTable({ rows }: { rows: ScreeningRow[] }) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Pengasuh</th>
            <th>Asesmen terakhir</th>
            <th>Tingkat</th>
            <th>Persetujuan</th>
            <th>
              <span className={shared.hidden}>Rincian</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <ScreeningListRow key={row.studentId} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
