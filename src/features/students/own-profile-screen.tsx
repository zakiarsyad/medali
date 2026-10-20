import shared from "@/ui/data-screen.module.css";
import { PageHead } from "@/ui/page-head";
import { CATEGORIES, STATUS_LABELS } from "./labels";
import type { OwnProfile } from "./own-profile";
import { ownProfileLine } from "./own-profile-words";
import type { OwnSurvey } from "./own-survey";
import { OwnSurveyCard } from "./own-survey-card";
import { residenceWords } from "./residence-words";
import { type RunningPeriod, semesterNow } from "./semester-now";
import {
  CategoryTags,
  Fact,
  MainFacts,
  OriginAgencyFact,
} from "./student-fact-parts";
import styles from "./student-list.module.css";
import { StudentMentorFact } from "./student-mentor-fact";
import { surveyDraftKey } from "./survey-draft";

/**
 * Profil saya: a student's own record, to read only. It holds nothing
 * that changes the record, which only the campus corrects. The pengasuh
 * and the group are named without a link: the Pengasuh menu is not a
 * student's to open. While a survey period is Dibuka, the survey to rate
 * the pengasuh stands at the top.
 */
export function OwnProfileScreen({
  student,
  period,
  survey = null,
}: {
  student: OwnProfile;
  /** The academic period that runs now, which says the semester. */
  period: RunningPeriod;
  /** Null while the student has no survey to fill in. */
  survey?: OwnSurvey | null;
}) {
  const semester = semesterNow(student, period);
  const hasTags = CATEGORIES.some(({ field }) => student[field]);
  return (
    <>
      <PageHead title={student.name}>
        {ownProfileLine(student, semester)}{" "}
        <span className={shared.badge}>{STATUS_LABELS[student.status]}</span>
      </PageHead>
      {survey !== null && (
        <OwnSurveyCard
          survey={survey}
          draftKey={surveyDraftKey(student.id, survey.surveyPeriodId)}
        />
      )}
      <section className={`${shared.panel} ${styles.profile}`}>
        {hasTags && (
          <p className={styles.tags}>
            <CategoryTags student={student} />
          </p>
        )}
        <dl className={styles.facts}>
          <MainFacts student={student} semester={semester} />
          <Fact title="Asrama">{residenceWords(student.residence)}</Fact>
          <OriginAgencyFact student={student} />
          <StudentMentorFact group={student.mentorGroup} />
        </dl>
      </section>
      <p className={styles.source}>
        Data ini berasal dari data kampus. Bila ada yang keliru, hubungi Unit
        Pembangunan Karakter.
      </p>
    </>
  );
}
