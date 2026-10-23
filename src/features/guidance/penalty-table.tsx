"use client";

import { useEffect, useState } from "react";
import { JenjangBadge } from "@/discipline-penalties/jenjang-badge";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { FormMessage } from "@/ui/form-message";
import { ProfileNameLink } from "@/ui/profile-name-link";
import styles from "./discipline-penalties.module.css";
import { type PenaltiesParams, penaltiesAddress } from "./penalty-address";
import type { PenaltyRow } from "./penalty-board";
import { PenaltyDetail } from "./penalty-detail";
import type { PenaltyFollowUp } from "./penalty-follow-up";
import {
  askRincian,
  type LoadedRincian,
  laterFollowUp,
  type RincianAsks,
  type RowFollowUp,
  withFollowUp,
} from "./penalty-rincian";
import { ruleOf } from "./penalty-rules";
import { PenaltyStatusCell } from "./penalty-status-cell";
import {
  lengthWords,
  RINCIAN_FAILED,
  RINCIAN_LOADING,
  TRY_AGAIN,
} from "./penalty-words";

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

function rowFollowUpOf(row: PenaltyRow): RowFollowUp {
  return { status: row.status, version: row.version };
}

/** "Rincian" as far as it came: loaded, refused or failed, or still asked. */
function RincianBody({
  loaded,
  failed,
  mayFollowUp,
  onFollowUp,
  onRetry,
}: {
  loaded: LoadedRincian | null;
  failed: boolean;
  mayFollowUp: boolean;
  onFollowUp: (next: PenaltyFollowUp) => void;
  onRetry: () => void;
}) {
  if (loaded !== null) {
    return (
      <PenaltyDetail
        penalty={loaded.penalty}
        mayFollowUp={mayFollowUp}
        onFollowUp={onFollowUp}
        counselling={loaded.counselling}
      />
    );
  }
  if (failed) {
    return (
      <>
        <FormMessage state={{ error: RINCIAN_FAILED, done: null }} />
        <button type="button" className={shared.quiet} onClick={onRetry}>
          {TRY_AGAIN}
        </button>
      </>
    );
  }
  return <p className={styles.note}>{RINCIAN_LOADING}</p>;
}

/** One ask of "Rincian": a new one each time, so that asking again is seen. */
interface RincianAsk {
  penaltyId: string;
}

/**
 * One penalty of "Daftar pelanggaran", with "Rincian" under it while it
 * is open. "Rincian" is asked of the server each time it opens, and
 * again when the page reads the row again, keeping the one shown until
 * the new one comes; an answer to an ask that was closed or followed by
 * another is dropped. A follow-up puts what the server gave back in both
 * the row and "Rincian".
 */
function PenaltyLine({
  row: read,
  params,
  mayFollowUp,
  asks,
}: {
  row: PenaltyRow;
  params: PenaltiesParams;
  mayFollowUp: boolean;
  asks: RincianAsks;
}) {
  const [readRow, setReadRow] = useState(read);
  const [shown, setShown] = useState(() => rowFollowUpOf(read));
  const [ask, setAsk] = useState<RincianAsk | null>(null);
  const [loaded, setLoaded] = useState<LoadedRincian | null>(null);
  const [failed, setFailed] = useState(false);
  if (readRow !== read) {
    setReadRow(read);
    setShown(rowFollowUpOf(read));
    if (ask !== null) setAsk({ penaltyId: read.id });
  }

  useEffect(() => {
    if (ask === null) return;
    let isLatest = true;
    function take(answer: LoadedRincian | null) {
      if (!isLatest) return;
      setLoaded(answer);
      setFailed(answer === null);
      if (answer !== null) {
        setShown((before) => laterFollowUp(before, answer.penalty));
      }
    }
    askRincian(asks, ask.penaltyId).then(take, () => take(null));
    return () => {
      isLatest = false;
    };
  }, [ask, asks]);

  function open() {
    setFailed(false);
    setAsk({ penaltyId: read.id });
  }

  function close() {
    setAsk(null);
    setLoaded(null);
    setFailed(false);
  }

  function followUp(next: PenaltyFollowUp) {
    setShown({ status: next.status, version: next.version });
    setLoaded((before) => before && withFollowUp(before, next));
  }

  const isOpen = ask !== null;
  const row = { ...read, ...shown };
  return (
    <>
      <tr>
        <td className={shared.rowHeading} data-title="Mahasiswa">
          <ProfileNameLink
            name={row.name}
            href={penaltiesAddress({ ...params, profileId: row.studentId })}
          />
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
            status={row.status}
            version={row.version}
            mayFollowUp={mayFollowUp}
            onFollowUp={followUp}
          />
        </td>
        <td className={shared.rowActions}>
          <button
            type="button"
            className={shared.link}
            aria-expanded={isOpen}
            onClick={isOpen ? close : open}
          >
            {isOpen ? "Tutup" : "Rincian"}
          </button>
        </td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={PENALTY_COLUMNS}>
            <RincianBody
              loaded={loaded}
              failed={failed}
              mayFollowUp={mayFollowUp}
              onFollowUp={followUp}
              onRetry={open}
            />
          </td>
        </tr>
      )}
    </>
  );
}

/**
 * The penalties of one page. On a phone each is a card. A name opens the
 * student's profile over the tab, as the server decides to show it.
 */
export function PenaltyTable({
  rows,
  params,
  mayFollowUp,
  asks,
}: {
  rows: PenaltyRow[];
  /** The choices of the list, kept when a profile opens over it. */
  params: PenaltiesParams;
  mayFollowUp: boolean;
  asks: RincianAsks;
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
            <PenaltyLine
              key={row.id}
              row={row}
              params={params}
              mayFollowUp={mayFollowUp}
              asks={asks}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
