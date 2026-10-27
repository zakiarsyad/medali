"use client";

import type { FormEvent } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { useSaveState } from "@/ui/use-save-state";
import { removeStudentAction } from "./actions";
import { useNotify } from "./student-notice";

const START: FormState = { error: null, done: null };

export function RemoveStudentButton({
  nim,
  name,
}: {
  nim: string;
  name: string;
}) {
  const notify = useNotify();

  async function remove(before: FormState, form: FormData): Promise<FormState> {
    notify(null);
    const after = await removeStudentAction(before, form);
    // The row is gone once removed, so the screen says it, not the row.
    if (after.done) notify(after.done);
    return { error: after.error, done: null };
  }

  const [state, action, pending] = useSaveState(remove, START);

  function confirmFirst(event: FormEvent<HTMLFormElement>) {
    const sure = window.confirm(
      `Hapus ${name} (${nim}) dari data mahasiswa? Data penilaian yang sudah tercatat untuk NIM ini tidak lagi ditampilkan.`,
    );
    if (!sure) event.preventDefault();
  }

  return (
    <form action={action} onSubmit={confirmFirst} className={shared.inline}>
      <input type="hidden" name="nim" value={nim} />
      <button type="submit" className={shared.danger} disabled={pending}>
        Hapus
      </button>
      <FormMessage state={state} />
    </form>
  );
}
