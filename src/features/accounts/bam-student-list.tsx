import { ROLES } from "@/auth/roles";
import styles from "@/ui/data-screen.module.css";
import panel from "./bam-panel.module.css";
import type { BamStudent } from "./list-bam-students";

function BamStudentCard({ student }: { student: BamStudent }) {
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
    </li>
  );
}

export function BamStudentList({ students }: { students: BamStudent[] }) {
  if (students.length === 0) {
    return (
      <p className={styles.empty}>Belum ada mahasiswa dengan peran BAM.</p>
    );
  }
  return (
    <ul className={panel.cards}>
      {students.map((student) => (
        <BamStudentCard key={student.accountId} student={student} />
      ))}
    </ul>
  );
}
