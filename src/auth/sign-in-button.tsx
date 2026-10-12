"use client";

import { useActionState } from "react";
import buttons from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./sign-in-screen.module.css";
import { startGoogleSignIn } from "./start-google-sign-in";

const START: FormState = { error: null, done: null };

export function SignInButton() {
  const [state, action, pending] = useActionState(startGoogleSignIn, START);
  return (
    <form action={action} className={styles.form}>
      <FormMessage state={state} />
      <button type="submit" className={buttons.button} disabled={pending}>
        Masuk dengan Google
      </button>
    </form>
  );
}
