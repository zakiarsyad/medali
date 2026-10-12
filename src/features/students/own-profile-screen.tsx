import shared from "@/ui/data-screen.module.css";
import { PageHead } from "@/ui/page-head";
import { CATEGORIES, STATUS_LABELS } from "./labels";
import { ownProfileLine } from "./own-profile-words";
import { type RunningPeriod, semesterNow } from "./semester-now";
import {
  CategoryTags,
  MainFacts,
  OriginAgencyFact,
} from "./student-fact-parts";
import type { StudentFacts } from "./student-facts";
import styles from "./student-list.module.css";

/**
 * Profil saya: a student's own record, to read only. It holds nothing
 * that changes the record, which only the campus corrects.
 */
export function OwnProfileScreen({
  student,
  period,
}: {
  student: StudentFacts;
  /** The academic period that runs now, which says the semester. */
  period: RunningPeriod;
}) {
  const semester = semesterNow(student, period);
  const hasTags = CATEGORIES.some(({ field }) => student[field]);
  return (
    <>
      <PageHead title={student.name}>
        {ownProfileLine(student, semester)}{" "}
        <span className={shared.badge}>{STATUS_LABELS[student.status]}</span>
      </PageHead>
      <section className={`${shared.panel} ${styles.profile}`}>
        {hasTags && (
          <p className={styles.tags}>
            <CategoryTags student={student} />
          </p>
        )}
        <dl className={styles.facts}>
          <MainFacts student={student} semester={semester} />
          <OriginAgencyFact student={student} />
        </dl>
      </section>
      <p className={styles.source}>
        Data ini berasal dari data kampus. Bila ada yang keliru, hubungi Unit
        Pembangunan Karakter.
      </p>
    </>
  );
}
