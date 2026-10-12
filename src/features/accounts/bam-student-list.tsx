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

function RowActions({
  student,
  view,
}: {
  student: BamStudent;
  view: ListView;
}) {
  return (
    <>
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
    </>
  );
}

function BamRoles({ student }: { student: BamStudent }) {
  return (
    <>
      {student.roles.map((role) => (
        <span key={role} className={styles.badge}>
          {ROLES[role].title}
        </span>
      ))}
      {!student.isActive && (
        <span
          className={panel.off}
          title="Mahasiswa tidak lagi aktif, sehingga peran BAM-nya tidak berlaku."
        >
          Tidak aktif
        </span>
      )}
    </>
  );
}

function BamStudentRow({
  student,
  view,
  isEditing,
}: {
  student: BamStudent;
  view: ListView;
  isEditing: boolean;
}) {
  return (
    <>
      <tr>
        <td data-title="Mahasiswa">
          <b>{student.name}</b>
          <small className={styles.detail}>NIM {student.nim}</small>
        </td>
        <td data-title="Program studi">{student.studyProgram}</td>
        <td data-title="Peran">
          <BamRoles student={student} />
        </td>
        <td className={styles.rowActions}>
          {!isEditing && <RowActions student={student} view={view} />}
        </td>
      </tr>
      {isEditing && (
        <tr>
          <td colSpan={4}>
            <BamEditForm student={student} back={listAddress(view)} />
          </td>
        </tr>
      )}
    </>
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
    <div className={styles.tableWrap}>
      <table className={`${styles.table} ${styles.stacked}`}>
        <thead>
          <tr>
            <th>Mahasiswa</th>
            <th>Program studi</th>
            <th>Peran</th>
            <th>
              <span className={styles.hidden}>Tindakan</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <BamStudentRow
              key={student.accountId}
              student={student}
              view={view}
              isEditing={student.isActive && student.accountId === editing}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
