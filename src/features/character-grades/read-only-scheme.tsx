import type { SchemeInForce } from "@/character-grades/grade-scheme";
import styles from "./character-grades.module.css";
import { typedOf } from "./scheme-fields";
import { SchemeView } from "./scheme-view";
import { READ_ONLY_NOTE, schemeNote } from "./scheme-words";

/** "Skema bobot" for a role that only reads it: every field switched off, and who sets it. */
export function ReadOnlyScheme({ inForce }: { inForce: SchemeInForce }) {
  return (
    <SchemeView typed={typedOf(inForce.scheme)} note={schemeNote(inForce.set)}>
      <p className={styles.note}>{READ_ONLY_NOTE}</p>
    </SchemeView>
  );
}
