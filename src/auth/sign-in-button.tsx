"use client";

import { useActionState } from "react";
import buttons from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./sign-in-screen.module.css";
import { startGoogleSignIn } from "./start-google-sign-in";

const START: FormState = { error: null, done: null };

/** `message` is shown until pressing the button gives one of its own. */
export function SignInButton({ message }: { message: string | null }) {
  const [state, action, pending] = useActionState(startGoogleSignIn, START);
  const shown = state.error ? state : { error: message, done: null };
  return (
    <form action={action} className={styles.form}>
      <FormMessage state={shown} />
      <button type="submit" className={buttons.button} disabled={pending}>
        Masuk dengan Google
      </button>
    </form>
  );
}
