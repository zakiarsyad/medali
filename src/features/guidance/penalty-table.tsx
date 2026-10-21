"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { JenjangBadge } from "./penalty-badges";
import type { PenaltyRow } from "./penalty-board";
import { PenaltyDetail } from "./penalty-detail";
import type { PenaltyFollowUp } from "./penalty-follow-up";
import { ruleOf } from "./penalty-rules";
import { PenaltyStatusCell } from "./penalty-status-cell";
import { lengthWords } from "./penalty-words";

/** How many columns "Daftar pelanggaran" has, for the row of "Rincian". */
const PENALTY_COLUMNS = 6;

/** Kerja sosial of a row: its length and its last day, or a dash. */
function SocialWorkCell({ row }: { row: PenaltyRow }) {
  const length = ruleOf(row.category, row.level).socialWork;
  if (length === null || row.socialWorkEndsOn === null) return <>-</>;
  return (
    <>
      {lengthWords(length)}
      <small className={shared.detail}>
        s.d. {shownDay(row.socialWorkEndsOn)}
      </small>
    </>
  );
}

function followUpOf(row: PenaltyRow): PenaltyFollowUp {
  const { status, conditionsMet, decision, version } = row;
  return { status, conditionsMet, decision, version };
}

/**
 * One penalty of "Daftar pelanggaran", with "Rincian" under it while it
 * is open. The row holds all "Rincian" shows, so nothing more is asked.
 * A follow-up puts the penalty the server gave back in the row; a row
 * the page reads again takes its place.
 */
function PenaltyLine({
  row: read,
  mayFollowUp,
}: {
  row: PenaltyRow;
  mayFollowUp: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [readRow, setReadRow] = useState(read);
  const [followUp, setFollowUp] = useState(() => followUpOf(read));
  if (readRow !== read) {
    setReadRow(read);
    setFollowUp(followUpOf(read));
  }
  const row = { ...read, ...followUp };
  return (
    <>
      <tr>
        <td className={shared.rowHeading} data-title="Mahasiswa">
          <b className={shared.typed}>{row.name}</b>
          <small className={shared.detail}>
            {row.nim} · {row.program}
          </small>
        </td>
        <td data-title="Tanggal">{shownDay(row.day)}</td>
        <td data-title="Hukuman">
          <JenjangBadge category={row.category} level={row.level} />
          <small className={shared.detail}>
            {ruleOf(row.category, row.level).penalty}
          </small>
        </td>
        <td data-title="Kerja sosial">
          <SocialWorkCell row={row} />
        </td>
        <td data-title="Status">
          <PenaltyStatusCell
            id={row.id}
            name={row.name}
            followUp={followUp}
            mayFollowUp={mayFollowUp}
            onFollowUp={setFollowUp}
          />
        </td>
        <td className={shared.rowActions}>
          <button
            type="button"
            className={shared.link}
            aria-expanded={isOpen}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? "Tutup" : "Rincian"}
          </button>
        </td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={PENALTY_COLUMNS}>
            <PenaltyDetail row={row} />
          </td>
        </tr>
      )}
    </>
  );
}

/** The penalties of one page. On a phone each is a card. */
export function PenaltyTable({
  rows,
  mayFollowUp,
}: {
  rows: PenaltyRow[];
  mayFollowUp: boolean;
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Tanggal</th>
            <th>Hukuman</th>
            <th>Kerja sosial</th>
            <th>Status</th>
            <th>
              <span className={shared.hidden}>Rincian</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <PenaltyLine key={row.id} row={row} mayFollowUp={mayFollowUp} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
