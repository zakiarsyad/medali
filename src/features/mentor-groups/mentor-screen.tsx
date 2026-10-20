import type { SQL } from "drizzle-orm";
import Link from "next/link";
import { forbidden, notFound } from "next/navigation";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import shared from "@/ui/data-screen.module.css";
import { groupCode } from "@/ui/group-code";
import { MENTOR_STATUS_TITLES } from "@/ui/mentor-status";
import { PageHead } from "@/ui/page-head";
import { listMentorEvaluations } from "./evaluation-rows";
import { EvaluationTable } from "./evaluation-table";
import { GroupMembersTable } from "./group-members-table";
import { readMemberScores } from "./member-scores";
import { MentorAssignmentsPanel } from "./mentor-assignments-panel";
import { readMentor } from "./mentor-detail";
import styles from "./mentor-groups.module.css";
import { MENTOR_LIST_ADDRESS } from "./mentor-list-address";
import { mentorLede } from "./mentor-words";
import { activeSummary } from "./score-averages";
import { ScoresPanel } from "./scores-panel";

/**
 * The page of one mentor. An address that names no mentor gets the app's
 * "not found"; a mentor outside the account's rows is refused aloud.
 */
export async function MentorScreen({
  limit,
  evaluationLimit,
  mentorId,
  detailVisible,
  studentAddressOf,
}: {
  /** Which mentors the account that opened the page may see. */
  limit: RowLimit;
  /**
   * Which evaluations the account may see, or null for an account that
   * may see none: it gets no "Evaluasi".
   */
  evaluationLimit: RowLimit | null;
  mentorId: string;
  /** The students whose detail the account may open, or null for none. */
  detailVisible: SQL | null;
  /**
   * The address that opens the detail of a student over this page, or null
   * for an account that may not open a student's detail.
   */
  studentAddressOf: ((studentId: string) => string) | null;
}) {
  const db = database();
  const [answer, period] = await Promise.all([
    readMentor(db, limit, mentorId, detailVisible),
    readRunningPeriod(db),
  ]);
  if (answer.kind === "not_found") notFound();
  if (answer.kind === "refused") forbidden();
  const { mentor } = answer;
  // Read once the mentor is found: their id is then known to be one.
  const [evaluations, scores] = await Promise.all([
    evaluationLimit === null
      ? null
      : listMentorEvaluations(db, evaluationLimit, mentor.id),
    readMemberScores(
      db,
      mentor.members.map((member) => member.id),
    ),
  ]);
  const hasMentees = mentor.members.length > 0;
  return (
    <>
      <p className={styles.back}>
        <Link href={MENTOR_LIST_ADDRESS} className={shared.link}>
          Semua pengasuh
        </Link>
      </p>
      <PageHead title={mentor.name}>
        {mentorLede(mentor)}{" "}
        <span className={shared.badge}>
          {MENTOR_STATUS_TITLES[mentor.status]}
        </span>
      </PageHead>
      <div className={styles.sideBySide}>
        <MentorAssignmentsPanel assignments={mentor.assignments} />
        {hasMentees && (
          <ScoresPanel
            title="Rerata binaan"
            summary={activeSummary(mentor.members, scores)}
            withBar={false}
          />
        )}
      </div>
      {evaluations && (
        <section className={shared.panel}>
          <h2 className={shared.heading}>Evaluasi</h2>
          <EvaluationTable evaluations={evaluations} />
        </section>
      )}
      <section className={shared.panel}>
        <h2 className={shared.heading}>Mahasiswa binaan</h2>
        {hasMentees ? (
          <GroupMembersTable
            members={mentor.members}
            period={period}
            scores={scores}
            detailAddressOf={studentAddressOf}
            groupOf={(member) => groupCode(member.group)}
          />
        ) : (
          <p className={shared.empty}>Tidak ada mahasiswa binaan saat ini.</p>
        )}
      </section>
    </>
  );
}
