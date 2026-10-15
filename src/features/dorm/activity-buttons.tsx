import shared from "@/ui/data-screen.module.css";
import styles from "./activities.module.css";
import {
  markDayOffAction,
  removeActivityAction,
  restoreActivityAction,
} from "./activity-actions";
import { ChangeButton } from "./change-button";

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
