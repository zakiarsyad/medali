import type { SchemeInForce } from "@/character-grades/grade-scheme";
import type { GradeScheme } from "@/character-grades/scheme-ids";
import styles from "./character-grades.module.css";
import { typedOf } from "./scheme-fields";
import { SchemeView } from "./scheme-view";
import { READ_ONLY_NOTE, schemeNote } from "./scheme-words";

function SchemeToRead({ scheme, note }: { scheme: GradeScheme; note: string }) {
  return (
    <SchemeView typed={typedOf(scheme)} note={note}>
      <p className={styles.note}>{READ_ONLY_NOTE}</p>
    </SchemeView>
  );
}

/** "Skema bobot" for a role that only reads it: every field switched off, and who sets it. */
export function ReadOnlyScheme({ inForce }: { inForce: SchemeInForce }) {
  return (
    <SchemeToRead scheme={inForce.scheme} note={schemeNote(inForce.set)} />
  );
}

/**
 * "Skema bobot" of a closed semester: the weights and the letter limits
 * its closing kept, read only for every role, Kepala Unit too.
 */
export function ClosedScheme({
  scheme,
  line,
}: {
  scheme: GradeScheme;
  /** "Nilai semester (period), ditetapkan (date). Tidak berubah lagi." */
  line: string;
}) {
  return <SchemeToRead scheme={scheme} note={line} />;
}
