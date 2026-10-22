"use client";

import { useState, useTransition } from "react";
import { DORM_SHORT_NAMES } from "@/dorms/dorms";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { FormMessage, type FormState } from "@/ui/form-message";
import { isOwnRecord } from "./own-record";
import { OwnRecordNote } from "./own-record-note";
import { cancelViolationAction } from "./violation-actions";
import type { ScheduledViolation } from "./violation-schedule";
import { appealEndOf } from "./violation-status";
import { punishmentText, shownHour } from "./violation-words";

export const NOTHING_WAITING = "Tidak ada pelanggaran yang menunggu diumumkan.";

export const CANCEL_QUESTION = "Batalkan publikasi pelanggaran ini?";

const START: FormState = { error: null, done: null };

function CancelButton({
  id,
  onAnswer,
}: {
  id: string;
  onAnswer: (answer: FormState) => void;
}) {
  const [pending, startSending] = useTransition();

  function press() {
    if (!window.confirm(CANCEL_QUESTION)) return;
    startSending(async () => onAnswer(await cancelViolationAction(id)));
  }

  return (
    <button
      type="button"
      className={shared.danger}
      onClick={press}
      disabled={pending}
    >
      Batalkan
    </button>
  );
}

/**
 * "Jadwal publikasi": each violation that waits for its announcement,
 * with the hour it is announced, until when it may be appealed, and
 * "Batalkan", but not on the account's own violation. A cancelled row
 * leaves the list as the page is drawn again.
 */
export function ViolationScheduleTable({
  rows,
  ownStudentId,
}: {
  rows: ScheduledViolation[];
  /** The student the account belongs to, or null. */
  ownStudentId: string | null;
}) {
  const [answer, setAnswer] = useState<FormState>(START);
  if (rows.length === 0) {
    return (
      <>
        <FormMessage state={answer} />
        <p className={shared.empty}>{NOTHING_WAITING}</p>
      </>
    );
  }
  return (
    <>
      <FormMessage state={answer} />
      <div className={shared.tableWrap}>
        <table className={`${shared.table} ${shared.stacked}`}>
          <thead>
            <tr>
              <th>Diumumkan</th>
              <th>Tanggal pelanggaran</th>
              <th>Mahasiswa</th>
              <th>Alasan pelanggaran</th>
              <th>Hukuman</th>
              <th>Diinput</th>
              <th>
                <span className={shared.hidden}>Tindakan</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td data-title="Diumumkan">
                  <b>{shownHour(row.announcedAt)}</b>
                  <small className={shared.detail}>
                    advokasi s.d. {shownHour(appealEndOf(row.announcedAt))}
                  </small>
                </td>
                <td data-title="Tanggal pelanggaran">{shownDay(row.day)}</td>
                <td data-title="Mahasiswa">
                  <b className={shared.typed}>{row.name}</b>
                  <small className={shared.detail}>
                    {row.nim} · {DORM_SHORT_NAMES[row.dorm]}
                  </small>
                </td>
                <td data-title="Alasan pelanggaran">
                  <span className={shared.typed}>{row.reason}</span>
                </td>
                <td data-title="Hukuman">
                  <span className={shared.typed}>
                    {punishmentText(row.punishment, row.otherPunishment)}
                  </span>
                </td>
                <td data-title="Diinput">
                  <span className={shared.typed}>{row.enteredBy}</span>
                </td>
                <td className={shared.rowActions}>
                  {isOwnRecord(ownStudentId, row.studentId) ? (
                    <OwnRecordNote />
                  ) : (
                    <CancelButton id={row.id} onAnswer={setAnswer} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
