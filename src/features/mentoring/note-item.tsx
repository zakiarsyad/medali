import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { MEDALI_VALUES, type ValueKey } from "@/ui/medali-values";
import { mentorLabel } from "@/ui/mentor-label";
import { ValueSwatch } from "@/ui/value-swatch";
import styles from "./mentoring.module.css";
import { FOLLOW_UP_TITLES, KIND_TITLES } from "./note-kinds";
import type { ListedNote } from "./note-list";

function ValueTags({ keys }: { keys: ValueKey[] }) {
  const ticked = MEDALI_VALUES.filter((value) => keys.includes(value.key));
  return (
    <span className={styles.values}>
      {ticked.map((value) => (
        <span key={value.key} className={styles.value}>
          <ValueSwatch value={value.key} />
          {value.name}
        </span>
      ))}
    </span>
  );
}

/**
 * One note: its day, the kind of contact with the values it touched, the
 * text, the follow-up when one was chosen, and who wrote it. A list of
 * more than one student also names the student, before the kind.
 */
export function NoteItem({
  note,
  student,
}: {
  note: ListedNote;
  /** The student as the list names them, or nothing where all notes are of one student. */
  student?: ReactNode;
}) {
  return (
    <li className={styles.item}>
      <span className={styles.quiet}>{shownDay(note.happenedOn)}</span>
      <p className={styles.itemTitle}>
        {student}
        <span>{KIND_TITLES[note.kind]}</span>
        <ValueTags keys={note.valueKeys} />
      </p>
      <p className={styles.text}>
        {note.note}
        {note.followUp !== "none" && (
          <em> Tindak lanjut: {FOLLOW_UP_TITLES[note.followUp]}.</em>
        )}
      </p>
      <small className={shared.detail}>
        Dicatat oleh {mentorLabel(note.writer)}
      </small>
    </li>
  );
}
