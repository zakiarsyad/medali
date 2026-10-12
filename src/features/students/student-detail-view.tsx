import shared from "@/ui/data-screen.module.css";
import {
  CATEGORIES,
  ENTRY_PATH_LABELS,
  SEX_LABELS,
  STATUS_LABELS,
} from "./labels";
import { residenceWords } from "./residence-words";
import { type RunningPeriod, semesterNow } from "./semester-now";
import { detailSemesterWords } from "./semester-words";
import type { StudentDetail } from "./student-detail";
import styles from "./student-list.module.css";
import { StudentMentorFact } from "./student-mentor-fact";
import type { GroupAddressOf } from "./student-mentor-group";

function Fact({
  title,
  wide = false,
  children,
}: {
  title: string;
  /** Takes the whole width of the box. */
  wide?: boolean;
  children: string;
}) {
  return (
    <div className={wide ? styles.wideFact : undefined}>
      <dt>{title}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** What the detail of one student shows. */
export function StudentDetailView({
  student,
  period,
  groupAddressOf,
}: {
  student: StudentDetail;
  /** The academic period that runs now, which says the semester. */
  period: RunningPeriod;
  groupAddressOf: GroupAddressOf;
}) {
  const tags = CATEGORIES.filter(({ field }) => student[field]);
  const semester = semesterNow(student, period);
  const path = ENTRY_PATH_LABELS[student.entryPath];
  return (
    <>
      <h2 className={shared.heading}>{student.name}</h2>
      <p className={shared.detail}>
        {student.nim} · {student.studyProgram}
      </p>
      <p className={styles.tags}>
        <span className={shared.badge}>{STATUS_LABELS[student.status]}</span>
        {tags.map(({ field, label }) => (
          <span key={field} className={shared.badge}>
            {label}
          </span>
        ))}
      </p>
      <dl className={styles.facts}>
        <Fact title="Angkatan">{`${student.cohortYear} · ${path}`}</Fact>
        <Fact title="Provinsi (domisili sesuai NIK)">
          {student.province ?? "-"}
        </Fact>
        <Fact title="Semester · tahap">
          {detailSemesterWords(student.status, semester)}
        </Fact>
        <Fact title="Kelas">{student.className ?? "Belum tercatat"}</Fact>
        <Fact title="Jenis kelamin">{SEX_LABELS[student.sex]}</Fact>
        <Fact title="Asrama">{residenceWords(student.residence)}</Fact>
        {student.entryPath === "transfer" && (
          <Fact title="Instansi asal" wide>
            {student.originAgency ?? "-"}
          </Fact>
        )}
        <StudentMentorFact
          group={student.mentorGroup}
          groupAddressOf={groupAddressOf}
        />
      </dl>
    </>
  );
}
