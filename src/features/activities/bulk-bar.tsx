import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import { bulkButtonWords } from "./bulk-validation";
import styles from "./verification.module.css";

/**
 * "Pilih semua" and "Validasi (n) terpilih" above the photo cards, with
 * what the last press answered. While nothing is ticked the button is
 * switched off, and so is everything while a press is on its way.
 */
export function BulkBar({
  tickable,
  ticked,
  busy,
  state,
  onTickAll,
  onValidate,
}: {
  /** How many cards of the page still wait, and so can be ticked. */
  tickable: number;
  ticked: number;
  busy: boolean;
  /** What the last press answered, or null before any. */
  state: FormState | null;
  onTickAll: (isTicked: boolean) => void;
  onValidate: () => void;
}) {
  const allTicked = tickable > 0 && ticked === tickable;
  return (
    <div className={styles.bulkBar}>
      <label className={shared.role}>
        <input
          type="checkbox"
          checked={allTicked}
          disabled={busy || tickable === 0}
          onChange={(event) => onTickAll(event.target.checked)}
        />
        Pilih semua
      </label>
      <button
        type="button"
        className={shared.button}
        disabled={busy || ticked === 0}
        onClick={onValidate}
      >
        {bulkButtonWords(ticked)}
      </button>
      {state !== null && <FormMessage state={state} />}
    </div>
  );
}

/** The tick of one waiting card. */
export function CardTick({
  name,
  isTicked,
  busy,
  onTick,
}: {
  /** The name of the student, which tells the ticks apart for a screen reader. */
  name: string;
  isTicked: boolean;
  busy: boolean;
  onTick: (isTicked: boolean) => void;
}) {
  return (
    <label className={`${shared.role} ${styles.tick}`}>
      <input
        type="checkbox"
        aria-label={`Pilih presensi ${name}`}
        checked={isTicked}
        disabled={busy}
        onChange={(event) => onTick(event.target.checked)}
      />
      Pilih
    </label>
  );
}
