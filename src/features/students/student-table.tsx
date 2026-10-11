import shared from "@/ui/data-screen.module.css";
import type { AddedStudent } from "./added-students";
import {
  CATEGORIES,
  ENTRY_PATH_LABELS,
  INPUT_SOURCE_LABELS,
  SEX_LABELS,
  STATUS_LABELS,
} from "./labels";
import styles from "./new-students.module.css";

const DAY = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const STATUS_STYLES: Record<AddedStudent["status"], string | undefined> = {
  active: styles.active,
  on_leave: styles.onLeave,
  inactive: styles.inactive,
};

function pathAndClass(student: AddedStudent): string {
  const path = ENTRY_PATH_LABELS[student.entryPath];
  return student.className ? `${path} · ${student.className}` : path;
}

function StudentRow({ student }: { student: AddedStudent }) {
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
          {student.inputSource ? INPUT_SOURCE_LABELS[student.inputSource] : ""}
        </small>
      </td>
    </tr>
  );
}

export function StudentTable({ students }: { students: AddedStudent[] }) {
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
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <StudentRow key={student.nim} student={student} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
