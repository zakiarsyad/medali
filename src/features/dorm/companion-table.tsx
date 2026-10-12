import shared from "@/ui/data-screen.module.css";
import type { ListedCompanion } from "./companion-list";
import styles from "./companions.module.css";
import { DORM_NAMES } from "./dorms";

/** The NIM, the study program, and the semester when it is known. */
function details(companion: ListedCompanion): string {
  const known = `${companion.nim} · ${companion.studyProgram}`;
  if (companion.semester === null) return known;
  return `${known} · smt ${companion.semester}`;
}

function Room({ companion }: { companion: ListedCompanion }) {
  const { room } = companion;
  if (!room) return <span className={styles.quiet}>Belum diplot</span>;
  return `Lantai ${room.floor}, kamar ${room.number}`;
}

function CompanionRow({ companion }: { companion: ListedCompanion }) {
  return (
    <tr>
      <td data-label="Mahasiswa">
        <b>{companion.name}</b>
        <small className={shared.detail}>{details(companion)}</small>
      </td>
      <td data-label="Asrama">{DORM_NAMES[companion.dorm]}</td>
      <td data-label="Kamar">
        <Room companion={companion} />
      </td>
      <td data-label="Keterangan">{companion.note ?? "-"}</td>
      <td data-label="Status">
        <span className={companion.isActive ? styles.on : styles.stopped}>
          {companion.isActive ? "Aktif" : "Tidak aktif"}
        </span>
      </td>
    </tr>
  );
}

/** Daftar kakak pendamping: a table on a laptop, cards on a phone. */
export function CompanionTable({
  companions,
}: {
  companions: ListedCompanion[];
}) {
  return (
    <table className={`${shared.table} ${styles.list}`}>
      <thead>
        <tr>
          <th>Mahasiswa</th>
          <th>Asrama</th>
          <th>Kamar</th>
          <th>Keterangan</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {companions.map((companion) => (
          <CompanionRow key={companion.studentId} companion={companion} />
        ))}
      </tbody>
    </table>
  );
}
