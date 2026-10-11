import styles from "@/ui/data-screen.module.css";
import type { FormState } from "./actions";

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
