import shared from "@/ui/data-screen.module.css";
import { CATEGORIES, ENTRY_PATH_LABELS, STATUS_LABELS } from "./labels";
import type { ListedStudent } from "./student-list";

/** The prototype shows no tag for Blended learning. */
type Category = (typeof CATEGORIES)[number];
type Tag = Exclude<Category, { field: "isBlended" }>;

const TAGS = CATEGORIES.filter(
  (category): category is Tag => category.field !== "isBlended",
);

/** The NIM, and the status when the student is not active. */
function nimAndStatus(student: ListedStudent): string {
  if (student.status === "active") return student.nim;
  return `${student.nim} · ${STATUS_LABELS[student.status].toLowerCase()}`;
}

function pathAndAgency(student: ListedStudent): string {
  const path = ENTRY_PATH_LABELS[student.entryPath];
  return student.originAgency ? `${path} · ${student.originAgency}` : path;
}

function StudentRow({ student }: { student: ListedStudent }) {
  const tags = TAGS.filter(({ field }) => student[field]);
  return (
    <tr>
      <td>
        <b>{student.name}</b>
        <small className={shared.detail}>{nimAndStatus(student)}</small>
        {tags.map(({ field, label }) => (
          <span key={field} className={shared.badge}>
            {label}
          </span>
        ))}
      </td>
      <td>
        {student.studyProgram}
        <small className={shared.detail}>{pathAndAgency(student)}</small>
      </td>
      <td>
        {student.cohortYear}
        <small className={shared.detail}>{student.className}</small>
      </td>
      <td>{student.province ?? "-"}</td>
    </tr>
  );
}

export function StudentListTable({ students }: { students: ListedStudent[] }) {
  return (
    <div className={shared.tableWrap}>
      <table className={shared.table}>
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
            <StudentRow key={student.nim} student={student} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
