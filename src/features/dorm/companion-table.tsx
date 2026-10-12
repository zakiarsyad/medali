import shared from "@/ui/data-screen.module.css";
import {
  restartCompanionAction,
  stopCompanionAction,
} from "./companion-actions";
import type { ListedCompanion } from "./companion-list";
import styles from "./companions.module.css";
import { DORM_NAMES } from "./dorms";
import { RoomButton } from "./room-button";

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

/** What "Nonaktifkan" asks first: stopping also takes them out of their room. */
function stopQuestion(companion: ListedCompanion): string {
  const question = `Nonaktifkan ${companion.name} sebagai kakak pendamping?`;
  if (!companion.room) return question;
  return `${question} Ia juga dikeluarkan dari kamar ${companion.room.number}.`;
}

function DutyButton({ companion }: { companion: ListedCompanion }) {
  const { studentId } = companion;
  if (!companion.isActive) {
    return (
      <RoomButton action={restartCompanionAction} ids={{ studentId }}>
        Aktifkan
      </RoomButton>
    );
  }
  return (
    <RoomButton
      action={stopCompanionAction}
      ids={{ studentId, roomId: companion.room?.id ?? "" }}
      confirm={stopQuestion(companion)}
    >
      Nonaktifkan
    </RoomButton>
  );
}

function CompanionRow({
  companion,
  mayManage,
}: {
  companion: ListedCompanion;
  mayManage: boolean;
}) {
  return (
    <tr>
      <td data-title="Mahasiswa">
        <b>{companion.name}</b>
        <small className={shared.detail}>{details(companion)}</small>
      </td>
      <td data-title="Asrama">{DORM_NAMES[companion.dorm]}</td>
      <td data-title="Kamar">
        <Room companion={companion} />
      </td>
      <td data-title="Keterangan">{companion.note ?? "-"}</td>
      <td data-title="Status">
        <span className={companion.isActive ? styles.on : styles.stopped}>
          {companion.isActive ? "Aktif" : "Tidak aktif"}
        </span>
      </td>
      {mayManage && (
        <td className={`${shared.rowActions} ${styles.duty}`}>
          <DutyButton companion={companion} />
        </td>
      )}
    </tr>
  );
}

/** Daftar kakak pendamping: a table on a laptop, one block per row on a phone. */
export function CompanionTable({
  companions,
  mayManage,
}: {
  companions: ListedCompanion[];
  /** Whether the account may stop and restart a duty, or only see the list. */
  mayManage: boolean;
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Asrama</th>
            <th>Kamar</th>
            <th>Keterangan</th>
            <th>Status</th>
            {mayManage && (
              <th>
                <span className={shared.hidden}>Tindakan</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {companions.map((companion) => (
            <CompanionRow
              key={companion.studentId}
              companion={companion}
              mayManage={mayManage}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
