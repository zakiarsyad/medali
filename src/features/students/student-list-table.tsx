import shared from "@/ui/data-screen.module.css";
import { CATEGORIES, ENTRY_PATH_LABELS, STATUS_LABELS } from "./labels";
import { type RunningPeriod, semesterNow } from "./semester-now";
import { rowSemesterWords } from "./semester-words";
import type { ListedStudent } from "./student-list";

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
}: {
  student: ListedStudent;
  period: RunningPeriod;
}) {
  const tags = CATEGORIES.filter(({ field }) => student[field]);
  const semester = semesterNow(student, period);
  return (
    <tr>
      <td data-title="Mahasiswa">
        <b>{student.name}</b>
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
    </tr>
  );
}

export function StudentListTable({
  students,
  period,
}: {
  students: ListedStudent[];
  /** The academic period that runs now, which says each row's semester. */
  period: RunningPeriod;
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
            <StudentRow key={student.nim} student={student} period={period} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
