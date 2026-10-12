import Link from "next/link";
import { ROLES } from "@/auth/roles";
import styles from "@/ui/data-screen.module.css";
import { BamEditForm } from "./bam-edit-form";
import panel from "./bam-panel.module.css";
import { type ListView, listAddress } from "./list-address";
import type { BamStudent } from "./list-bam-students";
import { RemoveBamButton } from "./remove-bam-button";

interface BamStudentListProps {
  students: BamStudent[];
  view: ListView;
  /** The student's account whose BAM roles are being changed. */
  editing: string | null;
}

function roleTitles(student: BamStudent): string {
  return student.roles.map((role) => ROLES[role].title).join(", ");
}

function CardActions({
  student,
  view,
}: {
  student: BamStudent;
  view: ListView;
}) {
  return (
    <div className={styles.rowActions}>
      {student.isActive && (
        <Link
          href={listAddress(view, { bamEdit: student.accountId })}
          className={styles.link}
        >
          Edit peran
        </Link>
      )}
      <RemoveBamButton
        accountId={student.accountId}
        name={student.name}
        roles={roleTitles(student)}
      />
    </div>
  );
}

function BamStudentCard({
  student,
  view,
  isEditing,
}: {
  student: BamStudent;
  view: ListView;
  isEditing: boolean;
}) {
  return (
    <li className={panel.card}>
      <div>
        <b>{student.name}</b>
        <small className={styles.detail}>
          NIM {student.nim} · {student.studyProgram}
        </small>
      </div>
      <div>
        {student.roles.map((role) => (
          <span key={role} className={styles.badge}>
            {ROLES[role].title}
          </span>
        ))}
      </div>
      {isEditing ? (
        <BamEditForm student={student} back={listAddress(view)} />
      ) : (
        <CardActions student={student} view={view} />
      )}
    </li>
  );
}

export function BamStudentList({
  students,
  view,
  editing,
}: BamStudentListProps) {
  if (students.length === 0) {
    return (
      <p className={styles.empty}>Belum ada mahasiswa dengan peran BAM.</p>
    );
  }
  return (
    <ul className={panel.cards}>
      {students.map((student) => (
        <BamStudentCard
          key={student.accountId}
          student={student}
          view={view}
          isEditing={student.isActive && student.accountId === editing}
        />
      ))}
    </ul>
  );
}
