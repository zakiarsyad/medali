import Form from "next/form";
import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import type { Candidates } from "./companion-candidates";
import { NO_PERIOD_TO_NAME } from "./companion-messages";
import { COMPANIONS_ADDRESS } from "./companions-address";
import { NameCompanionForm } from "./name-companion-form";
import styles from "./rooms.module.css";

function Search({ query }: { query: string }) {
  return (
    <Form action={COMPANIONS_ADDRESS} className={styles.search}>
      <input
        name="q"
        className={shared.input}
        placeholder="Cari nama atau NIM"
        defaultValue={query}
        aria-label="Cari nama atau NIM mahasiswa yang akan ditetapkan"
      />
      <button type="submit" className={shared.quiet}>
        Cari
      </button>
      {query !== "" && (
        <Link href={COMPANIONS_ADDRESS} className={shared.link}>
          Tampilkan semua
        </Link>
      )}
    </Form>
  );
}

/** How many students can be chosen, and what to do when not all are listed. */
function offeredWords(candidates: Candidates): string {
  const { shown, matching } = candidates;
  if (matching === 0) {
    return "Tidak ada mahasiswa yang dapat ditetapkan pada filter ini.";
  }
  const all = `${matching.toLocaleString("id-ID")} mahasiswa dapat dipilih`;
  if (matching <= shown.length) return `${all}.`;
  return `${all}, ${shown.length} pertama ada di pilihan. Cari nama atau NIM untuk mempersempit.`;
}

/**
 * The panel "Tetapkan kakak pendamping": a search, and the form that
 * offers the students it found. Without candidates no academic period
 * runs, and nobody can be named.
 */
export function NameCompanionPanel({
  query,
  candidates,
}: {
  query: string;
  /** The students who can be named. Null while no academic period runs. */
  candidates: Candidates | null;
}) {
  return (
    <section className={shared.panel}>
      <h2 className={shared.heading}>Tetapkan kakak pendamping</h2>
      {candidates === null ? (
        <p className={styles.quietLine} role="status">
          {NO_PERIOD_TO_NAME.error}
        </p>
      ) : (
        <>
          {/* Made anew for each address, so the field shows what was searched. */}
          <Search key={query} query={query} />
          <p className={styles.quietLine}>{offeredWords(candidates)}</p>
          <NameCompanionForm offered={candidates.shown} />
        </>
      )}
    </section>
  );
}
