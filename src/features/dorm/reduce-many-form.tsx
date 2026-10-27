"use client";

import { unstable_rethrow } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { REDUCE_NOT_SENT } from "./reduce-one-form";
import { reduceViolationsAction } from "./reduction-actions";
import { reductionReasonFault } from "./reduction-rules";
import {
  REASON_EXAMPLE,
  REASON_LABEL,
  reduceButtonWords,
  reduceManyQuestion,
} from "./reduction-words";
import type { AnnouncedViolation } from "./violation-announcement";
import { REDUCTION_REASON_MAX_LENGTH } from "./violation-ids";
import { ONE_STUDENT_TITLES, ViolationCells } from "./violation-lists";
import styles from "./violations.module.css";

export const NO_COUNTED = "Belum ada pelanggaran tercatat semester ini.";

const NOTHING: FormState = { error: null, done: null };

const TITLES = [...ONE_STUDENT_TITLES, "Kurangi"];

/**
 * The counted violations of a resident in "Proses", each with a tick
 * "Kurangi", Dasar pengurangan and the button with how many are ticked,
 * which asks before it reduces with how many will still count. A table,
 * and cards on a phone, with the reason under it in one column. The
 * answer stays when the rows change after it, and when the call ends.
 */
export function ReduceManyForm({
  studentId,
  name,
  rows,
  now,
}: {
  studentId: string;
  /** The name of the resident, which the question before reducing says. */
  name: string;
  /** Their violations of the semester that count, the latest first. */
  rows: AnnouncedViolation[];
  now: Date;
}) {
  const [ticked, setTicked] = useState<ReadonlySet<string>>(new Set());
  const [reason, setReason] = useState("");
  const [answer, setAnswer] = useState(NOTHING);
  const [busy, startReducing] = useTransition();
  // Set at the press itself: `busy` is known only once the form is drawn
  // again, and a second press can come before that.
  const isOnItsWay = useRef(false);
  // A tick of a row that left the list after a reduction counts no more.
  const picked = rows.filter((row) => ticked.has(row.id)).map((row) => row.id);

  function tick(id: string, isTicked: boolean) {
    const next = new Set(ticked);
    if (isTicked) next.add(id);
    if (!isTicked) next.delete(id);
    setTicked(next);
  }

  function reduce() {
    const fault = reductionReasonFault(reason);
    if (fault !== null) return setAnswer({ error: fault, done: null });
    if (isOnItsWay.current) return;
    const left = rows.length - picked.length;
    if (!window.confirm(reduceManyQuestion(picked.length, name, left))) return;
    isOnItsWay.current = true;
    startReducing(async () => {
      try {
        const sent = { studentId, violationIds: picked, reason };
        const answered = await reduceViolationsAction(sent);
        setAnswer(answered);
        if (answered.done === null) return;
        setTicked(new Set());
        setReason("");
      } catch (error) {
        unstable_rethrow(error);
        setAnswer({ error: REDUCE_NOT_SENT, done: null });
      } finally {
        isOnItsWay.current = false;
      }
    });
  }

  if (rows.length === 0) {
    return (
      <>
        <FormMessage state={answer} />
        <p className={shared.empty}>{NO_COUNTED}</p>
      </>
    );
  }
  return (
    <>
      <div className={shared.tableWrap}>
        <table className={`${shared.table} ${shared.stacked}`}>
          <thead>
            <tr>
              {TITLES.map((title) => (
                <th key={title}>{title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <ViolationCells
                  row={row}
                  now={now}
                  reader="staff"
                  withStudent={false}
                />
                <td data-title="Kurangi">
                  <label className={styles.tick}>
                    <input
                      type="checkbox"
                      checked={ticked.has(row.id)}
                      disabled={busy}
                      onChange={(event) => tick(row.id, event.target.checked)}
                    />
                    Kurangi
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`${shared.form} ${styles.spaced}`}>
        <label className={`${shared.field} ${styles.field} ${styles.full}`}>
          {REASON_LABEL}
          <textarea
            rows={2}
            className={shared.input}
            placeholder={REASON_EXAMPLE}
            maxLength={REDUCTION_REASON_MAX_LENGTH}
            value={reason}
            disabled={busy}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        <div className={`${shared.actions} ${styles.full}`}>
          <button
            type="button"
            className={shared.button}
            disabled={busy || picked.length === 0}
            onClick={reduce}
          >
            {reduceButtonWords(picked.length)}
          </button>
        </div>
        <p className={`${styles.note} ${styles.full}`}>
          Pelanggaran yang dikurangi tidak lagi dihitung untuk SP dan dihapus
          dari pengumuman pelanggaran.
        </p>
      </div>
      <FormMessage state={answer} />
    </>
  );
}
