import type { ReactNode } from "react";
import { residenceWords } from "./residence-words";
import { type RunningPeriod, semesterNow } from "./semester-now";
import type { StudentDetail } from "./student-detail";
import {
  CategoryTags,
  Fact,
  MainFacts,
  OriginAgencyFact,
} from "./student-fact-parts";
import { StudentHead } from "./student-head";
import styles from "./student-list.module.css";
import { StudentMentorFact } from "./student-mentor-fact";
import type {
  GroupAddressOf,
  MentorAddressOf,
  StudentMentorGroup,
} from "./student-mentor-group";

function addressOfGroup(
  group: StudentMentorGroup | null,
  groupAddressOf: GroupAddressOf,
): string | null {
  if (group === null) return null;
  return groupAddressOf(group);
}

function addressOfMentor(
  group: StudentMentorGroup | null,
  mentorAddressOf: MentorAddressOf,
): string | null {
  if (group === null || group.mentorId === null) return null;
  return mentorAddressOf(group.mentorId, group);
}

/** What the detail of one student shows. */
export function StudentDetailView({
  student,
  period,
  groupAddressOf,
  mentorAddressOf,
  headTags,
}: {
  student: StudentDetail;
  /** The academic period that runs now, which says the semester. */
  period: RunningPeriod;
  groupAddressOf: GroupAddressOf;
  mentorAddressOf: MentorAddressOf;
  /** What another area adds beside the status, before the category tags. */
  headTags?: ReactNode;
}) {
  return (
    <>
      <StudentHead
        student={student}
        tags={
          <>
            {headTags}
            <CategoryTags student={student} />
          </>
        }
      />
      <dl className={styles.facts}>
        <MainFacts student={student} semester={semesterNow(student, period)} />
        <Fact title="Asrama">{residenceWords(student.residence)}</Fact>
        <OriginAgencyFact student={student} />
        <StudentMentorFact
          group={student.mentorGroup}
          mentorAddress={addressOfMentor(student.mentorGroup, mentorAddressOf)}
          groupAddress={addressOfGroup(student.mentorGroup, groupAddressOf)}
        />
      </dl>
    </>
  );
}
