import Link from "next/link";
import shared from "@/ui/data-screen.module.css";
import { DAY } from "@/ui/day";
import type { AddedStudent } from "./added-students";
import {
  CATEGORIES,
  ENTRY_PATH_LABELS,
  inputSourceLabel,
  SEX_LABELS,
  STATUS_LABELS,
} from "./labels";
import styles from "./new-students.module.css";
import { newStudentsAddress } from "./new-students-address";
import { RemoveStudentButton } from "./remove-student-button";

const STATUS_STYLES: Record<AddedStudent["status"], string | undefined> = {
  active: styles.active,
  on_leave: styles.onLeave,
  inactive: styles.inactive,
};

function pathAndClass(student: AddedStudent): string {
  const path = ENTRY_PATH_LABELS[student.entryPath];
  return student.className ? `${path} · ${student.className}` : path;
}

function StudentRow({
  student,
  query,
}: {
  student: AddedStudent;
  query: string;
}) {
  const categories = CATEGORIES.filter(({ field }) => student[field]);
  return (
    <tr>
      <td>
        <b>{student.name}</b>
        <small className={shared.detail}>
          {student.nim} · {SEX_LABELS[student.sex]}
        </small>
        {categories.map(({ field, label }) => (
          <span key={field} className={shared.badge}>
            {label}
          </span>
        ))}
      </td>
      <td>
        {student.studyProgram}
        <small className={shared.detail}>{pathAndClass(student)}</small>
      </td>
      <td>{student.cohortYear}</td>
      <td>
        <span className={`${styles.status} ${STATUS_STYLES[student.status]}`}>
          {STATUS_LABELS[student.status]}
        </span>
      </td>
      <td>
        <span className={shared.detail}>
          {student.inputAt ? DAY.format(student.inputAt) : "-"} ·{" "}
          {student.inputBy ?? "-"}
        </span>
        <small className={shared.detail}>
          {student.inputSource ? inputSourceLabel(student.inputSource) : ""}
        </small>
      </td>
      <td className={shared.rowActions}>
        <Link
          href={newStudentsAddress(query, student.nim)}
          className={shared.link}
        >
          Ubah
        </Link>
        <RemoveStudentButton nim={student.nim} name={student.name} />
      </td>
    </tr>
  );
}

export function StudentTable({
  students,
  query,
}: {
  students: AddedStudent[];
  /** The search of the list, kept by the link to change a student. */
  query: string;
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={shared.table}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Program studi</th>
            <th>Angkatan</th>
            <th>Status</th>
            <th>Diinput</th>
            <th>
              <span className={shared.hidden}>Tindakan</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <StudentRow key={student.nim} student={student} query={query} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
