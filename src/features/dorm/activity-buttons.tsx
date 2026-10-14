import { useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import { FormMessage, type FormState } from "@/ui/form-message";
import styles from "./activities.module.css";
import {
  markDayOffAction,
  removeActivityAction,
  restoreActivityAction,
} from "./activity-actions";

/**
 * A button that sends one change and passes on what was done; a refusal
 * stays beside it. A change that takes something away asks first.
 */
function ChangeButton({
  send,
  question,
  look,
  onDone,
  children,
}: {
  send: () => Promise<FormState>;
  /** The question asked before a change that takes something away. */
  question: string | null;
  look: string | undefined;
  onDone: (message: string) => void;
  children: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startSending] = useTransition();

  function press() {
    if (question !== null && !window.confirm(question)) return;
    startSending(async () => {
      const after = await send();
      if (after.done) onDone(after.done);
      setError(after.error);
    });
  }

  return (
    <>
      <button type="button" className={look} onClick={press} disabled={pending}>
        {children}
      </button>
      <FormMessage state={{ error, done: null }} />
    </>
  );
}

/** "Tiada kegiatan" on one day of a repeating activity. It asks first. */
export function DayOffButton({
  id,
  day,
  question,
  onDone,
}: {
  id: string;
  day: string;
  question: string;
  onDone: (message: string) => void;
}) {
  return (
    <ChangeButton
      send={() => markDayOffAction(id, day)}
      question={question}
      look={shared.danger}
      onDone={onDone}
    >
      Tiada kegiatan
    </ChangeButton>
  );
}

/** "Hapus kegiatan" in the form of an activity. It asks first. */
export function RemoveActivityButton({
  id,
  onRemoved,
}: {
  id: string;
  onRemoved: (message: string) => void;
}) {
  return (
    <span className={styles.pushedEnd}>
      <ChangeButton
        send={() => removeActivityAction(id)}
        question="Hapus kegiatan asrama ini?"
        look={shared.danger}
        onDone={onRemoved}
      >
        Hapus kegiatan
      </ChangeButton>
    </span>
  );
}

/** "Urungkan" beside the message of a removal: brings the activity back. */
export function RestoreActivityButton({
  id,
  onRestored,
}: {
  id: string;
  onRestored: (message: string) => void;
}) {
  return (
    <ChangeButton
      send={() => restoreActivityAction(id)}
      question={null}
      look={shared.link}
      onDone={onRestored}
    >
      Urungkan
    </ChangeButton>
  );
}
