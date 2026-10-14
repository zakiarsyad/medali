"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { ListPager } from "@/ui/list-pager";
import { CancelLeaveButton } from "./cancel-leave-button";
import styles from "./leave.module.css";
import { ownLeaveAddress } from "./leave-address";
import { StatusBadge } from "./leave-badges";
import { coveredCountWords, type LeaveRow } from "./leave-row";
import { KIND_WORDS } from "./leave-words";
import type { OwnLeave } from "./own-leave";

function OwnLeaveRow({
  row,
  onCancelled,
}: {
  row: LeaveRow;
  onCancelled: (answer: FormState) => void;
}) {
  return (
    <tr>
      <td data-title="Jenis">
        {KIND_WORDS[row.kind]}
        {row.kind === "skip_activities" && (
          <p className={styles.quietLine}>{coveredCountWords(row)}</p>
        )}
      </td>
      <td data-title="Berangkat">{row.start}</td>
      <td data-title="Kembali">{row.end}</td>
      <td data-title="Keperluan">{row.purpose}</td>
      <td data-title="Status">
        <StatusBadge status={row.status} />
        {row.decisionNote !== "" && (
          <p className={styles.quietLine}>{row.decisionNote}</p>
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
  );
}

/**
 * "Riwayat izin saya" as it is drawn: the resident's requests, the latest
 * start first, paged, under what was said of the last cancel. The message
 * stands above the list, as the row of a cancelled request offers its
 * button no more once the page is read again.
 */
export function OwnLeaveTable({
  leave,
  said,
  onCancelled,
}: {
  leave: OwnLeave;
  /** What the last cancel made here said, or null. */
  said: string | null;
  onCancelled: (answer: FormState) => void;
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
              <OwnLeaveRow key={row.id} row={row} onCancelled={onCancelled} />
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
        addressOf={ownLeaveAddress}
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
 * kept, starts without the message; a cancel changes neither.
 */
export function historyKey(leave: OwnLeave): string {
  return `${leave.page} ${leave.matching}`;
}

function OwnLeaveHistory({ leave }: { leave: OwnLeave }) {
  const [said, setSaid] = useState<string | null>(null);
  return (
    <OwnLeaveTable
      leave={leave}
      said={said}
      onCancelled={(answer) => setSaid(saidAfterCancel(answer))}
    />
  );
}

/** "Riwayat izin saya", keeping what the last cancel said. */
export function OwnLeaveView({ leave }: { leave: OwnLeave }) {
  return <OwnLeaveHistory key={historyKey(leave)} leave={leave} />;
}
