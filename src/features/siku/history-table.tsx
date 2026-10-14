"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./siku.module.css";
import { cancelSikuEntryAction } from "./siku-actions";
import type { FormEntry, HistoryEntry } from "./siku-history";
import { KIND_WORDS, REASON_WORDS, signedPoints } from "./siku-words";

export const NO_HISTORY = "Belum ada penambahan atau pengurangan SIKU.";

export const CANCEL_QUESTION =
  "Batalkan penyesuaian ini? SIKU mahasiswa terkait dihitung ulang.";

export const CANCEL_UPLOAD_QUESTION =
  "Batalkan semua baris dari berkas ini? SIKU mahasiswa terkait dihitung ulang.";

/** An entry of the history, with the address that shows its students. */
export type HistoryRow = HistoryEntry & { seeAddress: string };

const START: FormState = { error: null, done: null };

function CancelButton({
  row,
  onAnswer,
}: {
  row: HistoryRow;
  onAnswer: (answer: FormState) => void;
}) {
  const [pending, startSending] = useTransition();
  const { id } = row;
  const question =
    row.source === "upload" ? CANCEL_UPLOAD_QUESTION : CANCEL_QUESTION;

  function press() {
    if (!window.confirm(question)) return;
    startSending(async () => onAnswer(await cancelSikuEntryAction(id)));
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

/** What an entry adds or takes, or the file it came from. */
function Adjustment({ row }: { row: HistoryRow }) {
  if (row.source === "upload") {
    return (
      <>
        <span className={shared.badge}>Unggah berkas</span>{" "}
        <span className={shared.typed}>{row.fileName}</span>
      </>
    );
  }
  return (
    <>
      <span
        className={`${shared.badge} ${row.kind === "gain" ? styles.gain : styles.loss}`}
      >
        {KIND_WORDS[row.kind]}
      </span>{" "}
      {REASON_WORDS[row.reason]}
    </>
  );
}

function Notes({ entry }: { entry: FormEntry }) {
  return (
    <>
      {entry.note !== "" && <span className={shared.typed}>{entry.note}</span>}
      {entry.basis !== "" && (
        <span className={shared.detail}>Dasar: {entry.basis}</span>
      )}
    </>
  );
}

/**
 * The entries of "Riwayat penambahan dan pengurangan SIKU": date, kind and
 * reason, points, how many students, Keterangan and Dasar with "Lihat
 * mahasiswa", and who entered it, with "Batalkan" for those who may. An
 * upload shows its file name in place of a kind and a reason, and "-" for
 * points. The answer to "Batalkan" stays above the list, since the row
 * leaves it once the entry is cancelled.
 */
export function HistoryTable({
  rows,
  mayCancel,
}: {
  rows: readonly HistoryRow[];
  mayCancel: boolean;
}) {
  const [answer, setAnswer] = useState<FormState>(START);
  return (
    <>
      <FormMessage state={answer} />
      {rows.length === 0 ? (
        <p className={shared.empty}>{NO_HISTORY}</p>
      ) : (
        <div className={shared.tableWrap}>
          <table className={`${shared.table} ${shared.stacked}`}>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Penyesuaian</th>
                <th>Poin</th>
                <th>Mahasiswa</th>
                <th>Keterangan</th>
                <th>Oleh</th>
                <th>
                  <span className={shared.hidden}>Tindakan</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td data-title="Tanggal">{shownDay(row.day)}</td>
                  <td data-title="Penyesuaian">
                    <Adjustment row={row} />
                  </td>
                  <td className={styles.strong} data-title="Poin">
                    {row.source === "form"
                      ? signedPoints(row.points, row.kind)
                      : "-"}
                  </td>
                  <td data-title="Mahasiswa">{row.students}</td>
                  <td data-title="Keterangan">
                    {row.source === "form" && <Notes entry={row} />}
                    <Link
                      href={row.seeAddress}
                      className={shared.link}
                      scroll={false}
                    >
                      Lihat mahasiswa
                    </Link>
                  </td>
                  <td className={shared.detail} data-title="Oleh">
                    {row.enteredBy}
                  </td>
                  <td className={shared.rowActions}>
                    {mayCancel && (
                      <CancelButton row={row} onAnswer={setAnswer} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
