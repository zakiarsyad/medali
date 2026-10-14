import shared from "@/ui/data-screen.module.css";
import { SEARCH_TEXT_MAX } from "@/ui/search-text";
import type { RecordStudent } from "./manual-record";
import styles from "./verification.module.css";

export const NOBODY_FOUND = "Tidak ada mahasiswa aktif yang cocok.";

function studentWords(student: RecordStudent): string {
  return `${student.name} · NIM ${student.nim} · ${student.program}`;
}

/** The students found for what was typed, each a press that picks them. */
export function Offered({
  query,
  found,
  onPick,
}: {
  query: string;
  found: RecordStudent[];
  onPick: (student: RecordStudent) => void;
}) {
  if (query.trim() === "") return null;
  if (found.length === 0) {
    return <p className={shared.detail}>{NOBODY_FOUND}</p>;
  }
  return (
    <div className={styles.found}>
      {found.map((student) => (
        <button
          key={student.id}
          type="button"
          className={shared.quiet}
          onClick={() => onPick(student)}
        >
          {studentWords(student)}
        </button>
      ))}
    </div>
  );
}

/**
 * The student of a record made by hand: a search by name or NIM while
 * nobody is picked, and then the one picked, with "Ganti" to pick again.
 */
export function RecordStudentField({
  student,
  query,
  found,
  busy,
  onQuery,
  onPick,
}: {
  student: RecordStudent | null;
  query: string;
  found: RecordStudent[];
  busy: boolean;
  onQuery: (query: string) => void;
  /** Picks a student, or nobody with null. */
  onPick: (student: RecordStudent | null) => void;
}) {
  if (student !== null) {
    return (
      <div className={`${shared.field} ${styles.wide}`}>
        Mahasiswa
        <span className={styles.picked}>
          <b>{studentWords(student)}</b>
          <button
            type="button"
            className={shared.link}
            disabled={busy}
            onClick={() => onPick(null)}
          >
            Ganti
          </button>
        </span>
      </div>
    );
  }
  return (
    <div className={`${styles.pick} ${styles.wide}`}>
      <label className={shared.field}>
        Mahasiswa
        <input
          type="search"
          className={shared.input}
          placeholder="Cari nama atau NIM"
          value={query}
          maxLength={SEARCH_TEXT_MAX}
          autoComplete="off"
          onChange={(event) => onQuery(event.target.value)}
        />
      </label>
      <Offered query={query} found={found} onPick={onPick} />
    </div>
  );
}
