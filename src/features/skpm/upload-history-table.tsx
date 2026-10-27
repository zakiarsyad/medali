"use client";

import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { shownMoment } from "@/ui/day";
import { FormMessage, type FormState } from "@/ui/form-message";
import { refusedSave, sentOr } from "@/ui/save-not-sent";
import { removeSkpmUploadAction } from "./skpm-actions";
import type { UploadLine } from "./skpm-uploads";
import { MODE_WORDS, removeQuestion } from "./skpm-words";

export const NO_UPLOADS = "Belum ada unggahan SKPM.";

const START: FormState = { error: null, done: null };

function RemoveButton({
  line,
  onAnswer,
}: {
  line: UploadLine;
  onAnswer: (answer: FormState) => void;
}) {
  const [pending, startSending] = useTransition();
  const { id, fileName } = line;

  function press() {
    if (!window.confirm(removeQuestion(fileName))) return;
    startSending(async () =>
      onAnswer(await sentOr(() => removeSkpmUploadAction(id), refusedSave)),
    );
  }

  return (
    <button
      type="button"
      className={shared.danger}
      onClick={press}
      disabled={pending}
    >
      Hapus
    </button>
  );
}

/** The mode of an upload, marked when a later "Ganti semua data" replaced it. */
function ModeCell({ line }: { line: UploadLine }) {
  return (
    <td data-title="Mode">
      {MODE_WORDS[line.mode]}
      {line.state.kind === "replaced" && (
        <>
          {" "}
          <span className={shared.badge}>tergantikan</span>
        </>
      )}
    </td>
  );
}

/** "Hapus" for those who may, or who removed the upload and when. */
function ActionCell({
  line,
  mayRemove,
  onAnswer,
}: {
  line: UploadLine;
  mayRemove: boolean;
  onAnswer: (answer: FormState) => void;
}) {
  const { state } = line;
  if (state.kind === "removed") {
    return (
      <td className={shared.detail} data-title="Dihapus">
        Dihapus {shownMoment(state.at)} oleh {state.by}
      </td>
    );
  }
  return (
    <td className={shared.rowActions}>
      {mayRemove && <RemoveButton line={line} onAnswer={onAnswer} />}
    </td>
  );
}

/**
 * The lines of "Riwayat unggahan": time, file, rows, students, mode and
 * who, with "Hapus" for those who may. A removed upload stays, with who
 * removed it and when. The answer to "Hapus" stays above the list.
 */
export function UploadHistoryTable({
  lines,
  mayRemove,
}: {
  lines: readonly UploadLine[];
  mayRemove: boolean;
}) {
  const [answer, setAnswer] = useState<FormState>(START);
  return (
    <>
      <FormMessage state={answer} />
      {lines.length === 0 ? (
        <p className={shared.empty}>{NO_UPLOADS}</p>
      ) : (
        <div className={shared.tableWrap}>
          <table className={`${shared.table} ${shared.stacked}`}>
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Berkas</th>
                <th>Baris</th>
                <th>Mahasiswa</th>
                <th>Mode</th>
                <th>Oleh</th>
                <th>
                  <span className={shared.hidden}>Tindakan</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id}>
                  <td className={shared.rowHeading} data-title="Waktu">
                    {shownMoment(line.enteredAt)}
                  </td>
                  <td data-title="Berkas">
                    <span className={shared.typed}>{line.fileName}</span>
                  </td>
                  <td data-title="Baris">
                    {line.rows.toLocaleString("id-ID")}
                  </td>
                  <td data-title="Mahasiswa">
                    {line.students.toLocaleString("id-ID")}
                  </td>
                  <ModeCell line={line} />
                  <td className={shared.detail} data-title="Oleh">
                    {line.enteredBy}
                  </td>
                  <ActionCell
                    line={line}
                    mayRemove={mayRemove}
                    onAnswer={setAnswer}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
