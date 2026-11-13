"use client";

import { useRef, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import { DialogBox } from "@/ui/dialog-box";
import { FormMessage, type FormState } from "@/ui/form-message";
import { sendForm } from "@/ui/send-form";
import { useSaveState } from "@/ui/use-save-state";
import { changeCompanionNoteAction } from "./companion-actions";
import { NOTE_MAX_LENGTH } from "./companion-limits";
import type { ListedCompanion } from "./companion-list";

const START: FormState = { error: null, done: null };

type NotedCompanion = Pick<ListedCompanion, "studentId" | "name" | "note">;

/**
 * The form "Ubah keterangan" in a box over the page. "Tutup", Escape and a
 * press outside the box all close it, and so does a save. A refusal stays
 * in the box to be corrected.
 */
export function CompanionNoteDialog({
  companion,
  onClose,
  onDone,
}: {
  companion: NotedCompanion;
  onClose: () => void;
  /** Told what was done once the Keterangan is saved. */
  onDone: (message: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  async function change(before: FormState, form: FormData) {
    const after = await changeCompanionNoteAction(before, form);
    if (after.done) {
      onDone(after.done);
      dialog.current?.close();
    }
    return after;
  }

  const [state, save, pending] = useSaveState(change, START);

  return (
    <DialogBox
      label="Ubah keterangan kakak pendamping"
      onClose={onClose}
      dialogRef={dialog}
    >
      <h2 className={shared.heading}>Ubah keterangan</h2>
      {/* noValidate: a Keterangan too long gets the app's own message. */}
      <form
        onSubmit={(event) => sendForm(event, save)}
        className={shared.form}
        noValidate
      >
        <input type="hidden" name="studentId" value={companion.studentId} />
        <p className={shared.field}>
          Mahasiswa
          <b>{companion.name}</b>
        </p>
        <label className={shared.field}>
          Keterangan
          <input
            name="note"
            className={shared.input}
            defaultValue={companion.note ?? ""}
            maxLength={NOTE_MAX_LENGTH}
          />
        </label>
        <FormMessage state={state} />
        <div className={shared.actions}>
          <button type="submit" className={shared.button} disabled={pending}>
            Simpan
          </button>
        </div>
      </form>
    </DialogBox>
  );
}

/**
 * "Ubah" on a row of Daftar kakak pendamping: it opens the form that
 * changes the Keterangan, and says beside it what a save did.
 */
export function CompanionNoteButton({
  companion,
}: {
  companion: NotedCompanion;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  function openForm() {
    setDone(null);
    setOpen(true);
  }

  return (
    <>
      <button type="button" className={shared.link} onClick={openForm}>
        Ubah
      </button>
      {open && (
        <CompanionNoteDialog
          companion={companion}
          onClose={() => setOpen(false)}
          onDone={setDone}
        />
      )}
      <FormMessage state={{ error: null, done }} />
    </>
  );
}
