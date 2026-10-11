"use client";

import { type FormEvent, useActionState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { removeStudentAction } from "./actions";

const START: FormState = { error: null, done: null };

export function RemoveStudentButton({
  nim,
  name,
}: {
  nim: string;
  name: string;
}) {
  const [state, action, pending] = useActionState(removeStudentAction, START);

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
