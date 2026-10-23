"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { ListPager } from "@/ui/list-pager";
import { CancelLeaveButton } from "./cancel-leave-button";
import styles from "./leave.module.css";
import { type LeaveListParams, ownLeaveAddress } from "./leave-address";
import { ReportBadge, StatusBadge, TimelinessBadge } from "./leave-badges";
import { coveredCountWords } from "./leave-row";
import { KIND_WORDS } from "./leave-words";
import type { OwnLeave, OwnLeaveRow as Row } from "./own-leave";
import { ReturnCamera } from "./return-camera";
import type { OwnReturn } from "./return-rules";

/** Under Kembali: the actual return, or when the report that waits was sent. */
function ReturnTime({ state }: { state: OwnReturn }) {
  if (state.kind === "back") {
    return <p className={styles.quietLine}>Kembali {state.returnedAt}</p>;
  }
  if (state.kind === "sent") {
    return <p className={styles.quietLine}>Lapor {state.sentAt}</p>;
  }
  return null;
}

/**
 * Under the status: where the report of a return stands and how late,
 * when the report opens, or "Lapor kembali ke asrama", after the note of
 * a rejected report.
 */
function ReturnState({
  state,
  onReport,
}: {
  state: OwnReturn;
  onReport: () => void;
}) {
  switch (state.kind) {
    case "none":
      return null;
    case "opens":
      return (
        <p className={styles.quietLine}>Lapor kembali dibuka {state.at}</p>
      );
    case "sent":
      return (
        <div className={styles.badges}>
          <ReportBadge status={state.status} />
          <TimelinessBadge timeliness={state.timeliness} />
        </div>
      );
    case "back":
      return (
        <div className={styles.badges}>
          <TimelinessBadge timeliness={state.timeliness} />
        </div>
      );
    case "open":
      return (
        <div className={styles.returnState}>
          {state.rejectionNote !== null && (
            <p className={styles.warning}>
              Laporan kembali ditolak: {state.rejectionNote} Kirim foto baru.
            </p>
          )}
          <button type="button" className={shared.button} onClick={onReport}>
            Lapor kembali ke asrama
          </button>
        </div>
      );
  }
}

/** What a row needs to open and send the report of a return. */
interface Reporting {
  /** The request whose report is open, or null for none. */
  openId: string | null;
  /** The key the next report is kept under. */
  newReportId: string;
  onOpen: (id: string | null) => void;
  onSent: (words: string) => void;
}

function OwnLeaveRow({
  row,
  reporting,
  onCancelled,
}: {
  row: Row;
  reporting: Reporting;
  onCancelled: (answer: FormState) => void;
}) {
  const isReporting = reporting.openId === row.id;
  return (
    <>
      <tr>
        <td data-title="Jenis">
          {KIND_WORDS[row.kind]}
          {row.kind === "skip_activities" && (
            <p className={styles.quietLine}>{coveredCountWords(row)}</p>
          )}
        </td>
        <td data-title="Berangkat">{row.start}</td>
        <td data-title="Kembali">
          {row.end}
          <ReturnTime state={row.return} />
        </td>
        <td data-title="Keperluan">{row.purpose}</td>
        <td data-title="Status">
          <StatusBadge status={row.status} />
          {row.decisionNote !== "" && (
            <p className={styles.quietLine}>{row.decisionNote}</p>
          )}
          {!isReporting && (
            <ReturnState
              state={row.return}
              onReport={() => reporting.onOpen(row.id)}
            />
          )}
        </td>
        <td>
          {row.status === "submitted" && (
            <CancelLeaveButton
              id={row.id}
              question={`Batalkan ${KIND_WORDS[row.kind].toLowerCase()} ${row.start}?`}
              onCancelled={onCancelled}
            />
          )}
        </td>
      </tr>
      {isReporting && (
        <tr>
          <td colSpan={6}>
            <ReturnCamera
              leaveId={row.id}
              reportId={reporting.newReportId}
              returnBy={row.end}
              onSent={reporting.onSent}
              onCancel={() => reporting.onOpen(null)}
            />
          </td>
        </tr>
      )}
    </>
  );
}

/**
 * "Riwayat izin saya" as it is drawn: the resident's requests, the latest
 * start first, paged, under what was said of the last cancel or report.
 * The message stands above the list, as the row of a cancelled request
 * offers its button no more once the page is read again. The report of
 * a return opens under its request.
 */
export function OwnLeaveTable({
  leave,
  said,
  reporting,
  onCancelled,
  staffList,
}: {
  leave: OwnLeave;
  /** What the last cancel or report made here said, or null. */
  said: string | null;
  reporting: Reporting;
  onCancelled: (answer: FormState) => void;
  /** The staff list shown below, whose place a page step keeps; or null. */
  staffList: LeaveListParams | null;
}) {
  if (leave.rows.length === 0) {
    return <p className={shared.empty}>Belum pernah mengajukan izin.</p>;
  }
  return (
    <>
      <FormMessage state={{ error: null, done: said }} />
      <div className={shared.tableWrap}>
        <table className={`${shared.table} ${shared.stacked}`}>
          <thead>
            <tr>
              <th>Jenis</th>
              <th>Berangkat</th>
              <th>Kembali</th>
              <th>Keperluan</th>
              <th>Status</th>
              <th>
                <span className={shared.hidden}>Tindakan</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {leave.rows.map((row) => (
              <OwnLeaveRow
                key={row.id}
                row={row}
                reporting={reporting}
                onCancelled={onCancelled}
              />
            ))}
          </tbody>
        </table>
      </div>
      <ListPager
        page={leave.page}
        matching={leave.matching}
        noun="izin"
        stepsOnOnePage={false}
        keepsPlace
        addressOf={(page) => ownLeaveAddress(page, staffList)}
      />
    </>
  );
}

/**
 * What stands above the list after a cancel: its message when it was
 * kept, and nothing after a refusal, which stays beside its button.
 */
export function saidAfterCancel(answer: FormState): string | null {
  return answer.done;
}

/**
 * Tells one state of the list from another for what a cancel said: a
 * page and how many requests there are. Another page, or a new request
 * kept, starts without the message; a cancel or a report changes
 * neither.
 */
export function historyKey(leave: OwnLeave): string {
  return `${leave.page} ${leave.matching}`;
}

function OwnLeaveHistory({
  leave,
  newReportId,
  staffList,
}: {
  leave: OwnLeave;
  newReportId: string;
  staffList: LeaveListParams | null;
}) {
  const [said, setSaid] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const reporting: Reporting = {
    openId,
    newReportId,
    onOpen: (id) => {
      setSaid(null);
      setOpenId(id);
    },
    onSent: (words) => {
      setOpenId(null);
      setSaid(words);
    },
  };
  return (
    <OwnLeaveTable
      leave={leave}
      said={said}
      reporting={reporting}
      onCancelled={(answer) => setSaid(saidAfterCancel(answer))}
      staffList={staffList}
    />
  );
}

/** "Riwayat izin saya", keeping what the last cancel or report said. */
export function OwnLeaveView({
  leave,
  newReportId,
  staffList,
}: {
  leave: OwnLeave;
  /** The key the next report of a return is kept under. */
  newReportId: string;
  /** The staff list shown below, whose place a page step keeps; or null. */
  staffList: LeaveListParams | null;
}) {
  return (
    <OwnLeaveHistory
      key={historyKey(leave)}
      leave={leave}
      newReportId={newReportId}
      staffList={staffList}
    />
  );
}
