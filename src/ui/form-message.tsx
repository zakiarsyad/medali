import styles from "./data-screen.module.css";

/** What a form says back after it is sent. */
export interface FormState {
  error: string | null;
  done: string | null;
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p className={styles.error} role="alert">
        {state.error}
      </p>
    );
  }
  if (state.done) {
    return (
      <p className={styles.done} role="status">
        {state.done}
      </p>
    );
  }
  return null;
}
