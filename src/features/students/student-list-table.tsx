import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { CATEGORIES, ENTRY_PATH_LABELS, STATUS_LABELS } from "./labels";
import { PressableRow } from "./pressable-row";
import { type RunningPeriod, semesterNow } from "./semester-now";
import { rowSemesterWords } from "./semester-words";
import type { ListedStudent } from "./student-list";
import styles from "./student-list.module.css";

/** The NIM, and the status when the student is not active. */
function nimAndStatus(student: ListedStudent): string {
  if (student.status === "active") return student.nim;
  return `${student.nim} · ${STATUS_LABELS[student.status].toLowerCase()}`;
}

function pathAndAgency(student: ListedStudent): string {
  const path = ENTRY_PATH_LABELS[student.entryPath];
  return student.originAgency ? `${path} · ${student.originAgency}` : path;
}

function StudentRow({
  student,
  period,
  detailAddress,
}: {
  student: ListedStudent;
  period: RunningPeriod;
  detailAddress: string;
}) {
  const tags = CATEGORIES.filter(({ field }) => student[field]);
  const semester = semesterNow(student, period);
  return (
    <PressableRow address={detailAddress} className={styles.row}>
      <td data-title="Mahasiswa">
        <Link href={detailAddress} scroll={false} className={styles.open}>
          <b>{student.name}</b>
        </Link>
        <small className={shared.detail}>{nimAndStatus(student)}</small>
        {tags.map(({ field, label }) => (
          <span key={field} className={shared.badge}>
            {label}
          </span>
        ))}
      </td>
      <td data-title="Program studi">
        {student.studyProgram}
        <small className={shared.detail}>{pathAndAgency(student)}</small>
      </td>
      <td data-title="Angkatan">
        {student.cohortYear}
        <small className={shared.detail}>
          {rowSemesterWords(semester, student.className)}
        </small>
      </td>
      <td data-title="Provinsi">{student.province ?? "-"}</td>
    </PressableRow>
  );
}

export function StudentListTable({
  students,
  period,
  detailAddressOf,
}: {
  students: ListedStudent[];
  /** The academic period that runs now, which says each row's semester. */
  period: RunningPeriod;
  /** The address that opens the detail of a student over this list. */
  detailAddressOf: (studentId: string) => string;
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Program studi</th>
            <th>Angkatan</th>
            <th>Provinsi</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <StudentRow
              key={student.nim}
              student={student}
              period={period}
              detailAddress={detailAddressOf(student.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
