import shared from "@/ui/data-screen.module.css";
import { STATUS_LABELS } from "./labels";
import { residenceWords } from "./residence-words";
import { type RunningPeriod, semesterNow } from "./semester-now";
import type { StudentDetail } from "./student-detail";
import {
  CategoryTags,
  Fact,
  MainFacts,
  OriginAgencyFact,
} from "./student-fact-parts";
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
}: {
  student: StudentDetail;
  /** The academic period that runs now, which says the semester. */
  period: RunningPeriod;
  groupAddressOf: GroupAddressOf;
  mentorAddressOf: MentorAddressOf;
}) {
  return (
    <>
      <h2 className={shared.heading}>{student.name}</h2>
      <p className={shared.detail}>
        {student.nim} · {student.studyProgram}
      </p>
      <p className={styles.tags}>
        <span className={shared.badge}>{STATUS_LABELS[student.status]}</span>
        <CategoryTags student={student} />
      </p>
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
