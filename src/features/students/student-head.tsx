import type { ReactNode } from "react";
import shared from "@/ui/data-screen.module.css";
import { STATUS_LABELS } from "./labels";
import type { StudentBrief } from "./student-brief";
import styles from "./student-list.module.css";

/** The top of a student's detail: name, NIM, program studi and status. */
export function StudentHead({
  student,
  tags,
}: {
  student: StudentBrief;
  /** More tags beside the status, if any. */
  tags?: ReactNode;
}) {
  return (
    <>
      <h2 className={shared.heading}>{student.name}</h2>
      <p className={shared.detail}>
        {student.nim} · {student.studyProgram}
      </p>
      <p className={styles.tags}>
        <span className={shared.badge}>{STATUS_LABELS[student.status]}</span>
        {tags}
      </p>
    </>
  );
}
