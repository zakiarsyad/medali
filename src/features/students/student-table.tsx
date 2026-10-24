import Link from "next/link";
import { DORM_NAMES } from "@/dorms/dorms";
import { ownRoomWords } from "@/dorms/student-room";
import type { BadgeTone } from "@/ui/badge-tone";
import shared from "@/ui/data-screen.module.css";
import { DAY } from "@/ui/day";
import { groupCode } from "@/ui/group-code";
import { toneBadge } from "@/ui/tone-badge";
import type { AddedStudent } from "./added-students";
import { NO_GROUP_WORDS } from "./group-choice-words";
import {
  CATEGORIES,
  ENTRY_PATH_LABELS,
  inputSourceLabel,
  SEX_LABELS,
  STATUS_LABELS,
} from "./labels";
import styles from "./new-students.module.css";
import {
  type ListPlace,
  newStudentsAddress,
  studentFileAddress,
} from "./new-students-address";
import { RemoveStudentButton } from "./remove-student-button";

const NO_EMAIL = "Belum ada email";

const STATUS_TONES: Record<AddedStudent["status"], BadgeTone> = {
  active: "good",
  on_leave: "warning",
  inactive: "plain",
};

function pathAndClass(student: AddedStudent): string {
  const path = ENTRY_PATH_LABELS[student.entryPath];
  return student.className ? `${path} · ${student.className}` : path;
}

/** How a student was put in; a link to the file when one was kept. */
function InputSource({ student }: { student: AddedStudent }) {
  if (!student.inputSource) return null;
  const label = inputSourceLabel(student.inputSource);
  if (!student.fileId) return label;
  return (
    // A plain link: the server answers with the file, not with a screen.
    <a
      href={studentFileAddress(student.fileId)}
      className={shared.link}
      download
    >
      {label}
    </a>
  );
}

function Dorm({ student }: { student: AddedStudent }) {
  const { dorm, companionRoom } = student;
  if (dorm === null) return <span className={shared.detail}>Non asrama</span>;
  if (companionRoom) return ownRoomWords(companionRoom);
  return DORM_NAMES[dorm];
}

function MentorGroup({ group }: { group: AddedStudent["group"] }) {
  if (group === null) {
    return <span className={toneBadge("warning")}>{NO_GROUP_WORDS}</span>;
  }
  return (
    <>
      {groupCode(group)}
      <small className={shared.detail}>{group.mentorName ?? "-"}</small>
    </>
  );
}

function StudentRow({
  student,
  place,
}: {
  student: AddedStudent;
  place: ListPlace;
}) {
  const categories = CATEGORIES.filter(({ field }) => student[field]);
  return (
    <tr>
      <td data-title="Mahasiswa">
        <b>{student.name}</b>
        <small className={shared.detail}>
          {student.nim} · {SEX_LABELS[student.sex]}
        </small>
        <small className={`${shared.detail} ${styles.email}`}>
          {student.email ?? NO_EMAIL}
        </small>
        {categories.map(({ field, label }) => (
          <span key={field} className={shared.badge}>
            {label}
          </span>
        ))}
      </td>
      <td data-title="Program studi">
        {student.studyProgram}
        <small className={shared.detail}>{pathAndClass(student)}</small>
      </td>
      <td data-title="Angkatan">{student.cohortYear}</td>
      <td data-title="Asrama">
        <Dorm student={student} />
      </td>
      <td data-title="Kelompok pengasuhan">
        <MentorGroup group={student.group} />
      </td>
      <td data-title="Status">
        <span className={toneBadge(STATUS_TONES[student.status])}>
          {STATUS_LABELS[student.status]}
        </span>
      </td>
      <td data-title="Diinput">
        <span className={shared.detail}>
          {student.inputAt ? DAY.format(student.inputAt) : "-"} ·{" "}
          {student.inputBy ?? "-"}
        </span>
        <small className={`${shared.detail} ${styles.source}`}>
          <InputSource student={student} />
        </small>
      </td>
      <td className={shared.rowActions}>
        <Link
          href={newStudentsAddress(place, student.nim)}
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
  place,
}: {
  students: AddedStudent[];
  /** The search and the page of the list, kept by the link to change a student. */
  place: ListPlace;
}) {
  return (
    <div className={shared.tableWrap}>
      <table className={`${shared.table} ${shared.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Program studi</th>
            <th>Angkatan</th>
            <th>Asrama</th>
            <th>Kelompok pengasuhan</th>
            <th>Status</th>
            <th>Diinput</th>
            <th>
              <span className={shared.hidden}>Tindakan</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <StudentRow key={student.nim} student={student} place={place} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
