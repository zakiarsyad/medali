import shared from "@/ui/data-screen.module.css";
import { CATEGORIES, ENTRY_PATH_LABELS, SEX_LABELS } from "./labels";
import { detailSemesterWords } from "./semester-words";
import type { StudentFacts } from "./student-facts";
import styles from "./student-list.module.css";

export function Fact({
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

/** One tag for each category the student is in. */
export function CategoryTags({ student }: { student: StudentFacts }) {
  const tags = CATEGORIES.filter(({ field }) => student[field]);
  return tags.map(({ field, label }) => (
    <span key={field} className={shared.badge}>
      {label}
    </span>
  ));
}

/** The facts the student detail and Profil saya both start with. */
export function MainFacts({
  student,
  semester,
}: {
  student: StudentFacts;
  /** The semester the student is in now, or null when there is none. */
  semester: number | null;
}) {
  const path = ENTRY_PATH_LABELS[student.entryPath];
  return (
    <>
      <Fact title="Angkatan">{`${student.cohortYear} · ${path}`}</Fact>
      <Fact title="Provinsi (domisili sesuai NIK)">
        {student.province ?? "-"}
      </Fact>
      <Fact title="Semester · tahap">
        {detailSemesterWords(student.status, semester)}
      </Fact>
      <Fact title="Kelas">{student.className ?? "Belum tercatat"}</Fact>
      <Fact title="Jenis kelamin">{SEX_LABELS[student.sex]}</Fact>
    </>
  );
}

/** Where an alih program student came from. Other students have none. */
export function OriginAgencyFact({ student }: { student: StudentFacts }) {
  if (student.entryPath !== "transfer") return null;
  return (
    <Fact title="Instansi asal" wide>
      {student.originAgency ?? "-"}
    </Fact>
  );
}
