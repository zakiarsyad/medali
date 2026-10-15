"use client";

import { unstable_rethrow } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { FormMessage, type FormState } from "@/ui/form-message";
import { undoReductionAction } from "./reduction-actions";
import type { ShownReduction } from "./reduction-list";
import { NO_REDUCTIONS, UNDO_QUESTION } from "./reduction-words";
import { sendUndo, type UndoEdges } from "./undo-send";
import { punishmentText, shownHour } from "./violation-words";

const START: FormState = { error: null, done: null };

/** The undoing's ties to the server and to the framework. */
const EDGES: UndoEdges = {
  send: undoReductionAction,
  rethrow: unstable_rethrow,
};

function UndoButton({
  id,
  onAnswer,
}: {
  id: string;
  onAnswer: (answer: FormState) => void;
}) {
  const [pending, startSending] = useTransition();
  // Set at the press itself: `pending` is known only once the button is
  // drawn again, and a second press can come before that.
  const isOnItsWay = useRef(false);

  function press() {
    if (isOnItsWay.current) return;
    if (!window.confirm(UNDO_QUESTION)) return;
    isOnItsWay.current = true;
    startSending(async () => {
      try {
        onAnswer(await sendUndo(id, EDGES));
      } finally {
        isOnItsWay.current = false;
      }
    });
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
 * The rows of "Riwayat pengurangan pelanggaran": the student, the
 * violation, Dasar pengurangan, who and when, and "Batalkan" for an
 * account that `undoes`, but not on its own student's rows. An undone
 * row leaves the list as the page is drawn again; the answer stays above
 * it. A table, and cards on a phone.
 */
export function ReductionsTable({
  rows,
  undoes,
  ownStudentId,
}: {
  rows: ShownReduction[];
  /** Whether the account undoes reductions: Pengelola Asrama. */
  undoes: boolean;
  ownStudentId: string | null;
}) {
  const [answer, setAnswer] = useState<FormState>(START);
  if (rows.length === 0) {
    return (
      <>
        <FormMessage state={answer} />
        <p className={shared.empty}>{NO_REDUCTIONS}</p>
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
              <th>Mahasiswa</th>
              <th>Pelanggaran</th>
              <th>Dasar pengurangan</th>
              <th>Oleh</th>
              {undoes && (
                <th>
                  <span className={shared.hidden}>Tindakan</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className={shared.rowHeading} data-title="Mahasiswa">
                  <b className={shared.typed}>{row.name}</b>
                  <small className={shared.detail}>{row.nim}</small>
                </td>
                <td data-title="Pelanggaran">
                  <span className={shared.typed}>
                    {shownDay(row.day)} · {row.reason}
                  </span>
                  <small className={`${shared.detail} ${shared.typed}`}>
                    {punishmentText(row.punishment, row.otherPunishment)}
                  </small>
                </td>
                <td data-title="Dasar pengurangan">
                  <span className={shared.typed}>{row.reductionReason}</span>
                </td>
                <td data-title="Oleh">
                  <span className={shared.typed}>{row.reducedBy}</span>
                  <small className={shared.detail}>
                    {shownHour(row.reducedAt)}
                  </small>
                </td>
                {undoes && (
                  <td className={shared.rowActions}>
                    {row.studentId !== ownStudentId && (
                      <UndoButton id={row.id} onAnswer={setAnswer} />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
