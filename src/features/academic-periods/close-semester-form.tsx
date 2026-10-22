"use client";

import Link from "next/link";
import { useActionState } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { closeSemesterAction } from "./actions";
import { UNDERSTOOD, UNDERSTOOD_FIELD } from "./close-request";
import { PERIODS_ADDRESS } from "./period-address";
import styles from "./periods.module.css";

const START: FormState = { error: null, done: null };

export function CloseSemesterForm({ periodId }: { periodId: string }) {
  const [state, close, pending] = useActionState(closeSemesterAction, START);
  return (
    <form action={close} className={styles.closeForm}>
      <input type="hidden" name="id" value={periodId} />
      <label className={shared.role}>
        <input type="checkbox" name={UNDERSTOOD_FIELD} value={UNDERSTOOD} />
        Saya paham nilai semester ini tidak dapat diubah lagi.
      </label>
      <FormMessage state={state} />
      <div className={shared.actions}>
        <button type="submit" className={shared.button} disabled={pending}>
          Tutup semester ini
        </button>
        <Link href={PERIODS_ADDRESS} scroll={false} className={shared.quiet}>
          Batal
        </Link>
      </div>
    </form>
  );
}
