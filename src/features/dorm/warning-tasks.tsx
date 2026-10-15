import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { processLetterAddress } from "./tasks-address";
import { NOTHING_WAITS, type WarningTask } from "./tasks-card";
import styles from "./violations.module.css";
import { LetterMark } from "./warning-calls-panel";

/** Klarifikasi ditolak, or a dash for none, as in the prototype. */
function rejectedWords(rejected: number): string {
  if (rejected === 0) return "-";
  return rejected.toLocaleString("id-ID");
}

function WarningTaskRow({ task }: { task: WarningTask }) {
  return (
    <tr>
      <td className={shared.rowHeading} data-title="Mahasiswa">
        <b>{task.name}</b>
        <small className={shared.detail}>
          {task.nim} · {task.room}
        </small>
      </td>
      <td data-title="Penetapan">
        <span className={`${shared.badge} ${styles.warn}`}>
          Penetapan SP {task.level}
        </span>{" "}
        <LetterMark level={task.mark} />
      </td>
      <td data-title="Pelanggaran">{task.counted.toLocaleString("id-ID")}</td>
      <td data-title="Klarifikasi ditolak">{rejectedWords(task.rejected)}</td>
      <td className={shared.rowActions}>
        <Link
          href={processLetterAddress(task.studentId)}
          className={shared.button}
          aria-label={`Proses ${task.name}`}
        >
          Proses
        </Link>
      </td>
    </tr>
  );
}

/**
 * The students due for an SP, each with the SP due and the one held,
 * Pelanggaran and Klarifikasi ditolak of the semester, and "Proses",
 * which opens the SP form on Pelanggaran.
 */
export function WarningTasks({ tasks }: { tasks: WarningTask[] }) {
  if (tasks.length === 0)
    return <p className={shared.empty}>{NOTHING_WAITS}</p>;
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Penetapan</th>
            <th>Pelanggaran</th>
            <th>Klarifikasi ditolak</th>
            <th>
              <span className={shared.hidden}>Tindakan</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <WarningTaskRow key={task.studentId} task={task} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
