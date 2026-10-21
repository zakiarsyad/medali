import { FinalCategoryBadge } from "@/health-notes/category-badge";
import type { ShownCategory } from "@/health-notes/fitness-category";
import { SERIOUSNESS } from "@/health-notes/health-category";
import { NO_NOTE, NOTE_MISSING, noteText } from "@/health-notes/health-words";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { ProfileNameLink } from "@/ui/profile-name-link";
import styles from "./fitness.module.css";
import { type FitnessParams, fitnessAddress } from "./fitness-address";
import type { FitnessListRow, RowHealth } from "./fitness-board";

export const NO_FITNESS_MATCHES = "Tidak ada data pada filter ini.";

/** Whether a student of this category should have a health note. */
export function needsNote(category: ShownCategory): boolean {
  if (category === "untested") return false;
  return SERIOUSNESS[category] >= SERIOUSNESS.attention;
}

/** "Catatan kesehatan" of a student whose notes the account reads. */
function NoteCell({
  health,
  category,
}: {
  health: RowHealth;
  category: ShownCategory;
}) {
  if (health.note !== null) return noteText(health.note);
  if (needsNote(category)) {
    return (
      <span
        className={`${shared.badge} ${styles.category} ${styles.attention}`}
      >
        {NOTE_MISSING}
      </span>
    );
  }
  return <span className={styles.muted}>{NO_NOTE}</span>;
}

function StudentRow({
  row,
  showsNotes,
  params,
}: {
  row: FitnessListRow;
  showsNotes: boolean;
  params: FitnessParams;
}) {
  const { latest, health, final } = row;
  return (
    <tr>
      <td className={shared.rowHeading} data-title="Mahasiswa">
        <ProfileNameLink
          name={row.name}
          href={fitnessAddress({ ...params, profileId: row.id })}
        />
        <small className={shared.detail}>
          {row.nim} · {row.program}
        </small>
      </td>
      <td data-title="Tes">{latest ? shownDay(latest.testedOn) : "-"}</td>
      <td className={styles.score} data-title="Skor">
        {latest ? latest.score : "-"}
      </td>
      <td data-title="Kategori">
        <FinalCategoryBadge final={final} showsMark={health !== null} />
      </td>
      {showsNotes && (
        <td data-title="Catatan kesehatan">
          {health && <NoteCell health={health} category={final.category} />}
        </td>
      )}
    </tr>
  );
}

/**
 * "Hasil tes kebugaran": each student with the day of their latest test,
 * its score and their final category, or Belum dites. A role that reads
 * health notes also gets "Catatan kesehatan", filled on the rows whose
 * notes it reads. On a phone each student is a block of its own.
 */
export function FitnessListTable({
  rows,
  showsNotes,
  params,
}: {
  rows: readonly FitnessListRow[];
  /** Whether the account reads the notes of any student here. */
  showsNotes: boolean;
  /** The tab's choices, kept when a name opens the student's profile. */
  params: FitnessParams;
}) {
  if (rows.length === 0) {
    return <p className={shared.empty}>{NO_FITNESS_MATCHES}</p>;
  }
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Tes</th>
            <th>Skor</th>
            <th>Kategori</th>
            {showsNotes && <th>Catatan kesehatan</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <StudentRow
              key={row.id}
              row={row}
              showsNotes={showsNotes}
              params={params}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
