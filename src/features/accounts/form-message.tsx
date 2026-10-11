import type { FormState } from "./actions";
import styles from "./users-screen.module.css";

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
