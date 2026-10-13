import type { SQL } from "drizzle-orm";
import Link from "next/link";
import { forbidden, notFound } from "next/navigation";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { groupCode } from "@/ui/group-code";
import { GROUP_MIN, isSmallGroup } from "@/ui/group-size";
import { PageHead } from "@/ui/page-head";
import { listGroupEvaluations } from "./evaluation-rows";
import { EvaluationTable } from "./evaluation-table";
import type { GroupDetail } from "./group-detail";
import { GroupHeadActions } from "./group-head-actions";
import { GROUP_LIST_ADDRESS } from "./group-list-address";
import { GroupMembersTable } from "./group-members-table";
import { GroupMentorPanel } from "./group-mentor-panel";
import { readGroupPage } from "./group-page";
import { academicClasses, countedMembers } from "./member-rules";
import styles from "./mentor-groups.module.css";
import { currentMentor } from "./mentor-history";
import type { MentorAddressOf } from "./open-mentor-address";
import { scheduledWords } from "./replacement-words";
import { readWaitingReplacementOf } from "./waiting-replacement-of";

/** The line under the code: whose group it is, since when, and how large. */
function groupLede(group: GroupDetail): string {
  const path = group.entryPath === "transfer" ? " jalur alih program" : "";
  const whose = `${group.studyProgram} angkatan ${group.cohortYear}${path}`;
  const formed = `dibentuk saat masuk pada ${shownDay(group.startsOn)}`;
  const size = `${countedMembers(group.members)} mahasiswa aktif`;
  const classes = `${academicClasses(group.members)} kelas akademik`;
  return `Kelompok pengasuhan ${whose}, ${formed}. ${size}, saat ini tersebar di ${classes}.`;
}

/**
 * The page of one group. An address that names no group gets the app's
 * "not found"; a group outside the account's rows is refused aloud.
 */
export async function GroupScreen({
  limit,
  evaluationLimit,
  evaluateAddress,
  replaceAddress,
  groupId,
  detailVisible,
  memberAddressOf,
  mentorAddressOf,
}: {
  /** Which rows the account that opened the page may see. */
  limit: RowLimit;
  /**
   * Which evaluations the account may see, or null for an account that
   * may see none: it gets no "Evaluasi pengasuh".
   */
  evaluationLimit: RowLimit | null;
  /**
   * The address of the form that evaluates the mentor of this group, or
   * null for an account that may not evaluate: it gets no button.
   */
  evaluateAddress: string | null;
  /**
   * The address of the form that replaces the mentor of this group, or
   * null for an account that may not set a replacement: it gets no button.
   */
  replaceAddress: string | null;
  groupId: string;
  /** The students whose detail the account may open, or null for none. */
  detailVisible: SQL | null;
  /**
   * The address that opens the detail of a member over this page, or null
   * for an account that may not open a student's detail.
   */
  memberAddressOf: ((studentId: string) => string) | null;
  mentorAddressOf: MentorAddressOf;
}) {
  const db = database();
  const [answer, period] = await Promise.all([
    readGroupPage(db, limit, groupId, detailVisible),
    readRunningPeriod(db),
  ]);
  if (answer.kind === "not_found") notFound();
  if (answer.kind === "refused") forbidden();
  const { group, recentNotes } = answer;
  // Read once the group is found: its id is then known to be one.
  const [evaluations, waiting] = await Promise.all([
    evaluationLimit === null
      ? null
      : listGroupEvaluations(db, evaluationLimit, group.id),
    readWaitingReplacementOf(db, group.id),
  ]);
  const mentor = currentMentor(group.mentors);
  const hasMentor = mentor !== null;
  return (
    <>
      <p className={styles.back}>
        <Link href={GROUP_LIST_ADDRESS} className={shared.link}>
          Semua kelompok pengasuhan
        </Link>
      </p>
      <PageHead title={groupCode(group)}>{groupLede(group)}</PageHead>
      {hasMentor && (
        <GroupHeadActions
          evaluateAddress={evaluateAddress}
          replaceAddress={replaceAddress}
        />
      )}
      {isSmallGroup(countedMembers(group.members)) && (
        <p className={styles.note}>
          Anggota aktif kelompok ini kurang dari {GROUP_MIN} karena sebagian
          anggota angkatannya sudah lulus, tidak aktif, atau jumlah penerimaan
          prodi kecil.
        </p>
      )}
      {waiting !== null && (
        <p className={`${styles.note} ${styles.warned}`}>
          {scheduledWords(waiting)}
        </p>
      )}
      <GroupMentorPanel
        mentors={group.mentors}
        mentorAddress={mentor && mentorAddressOf(mentor.mentorId, group)}
        recentNotes={recentNotes}
      />
      {evaluations && (
        <section className={shared.panel}>
          <h2 className={shared.heading}>Evaluasi pengasuh</h2>
          <EvaluationTable evaluations={evaluations} />
        </section>
      )}
      <section className={shared.panel}>
        <div className={styles.panelHead}>
          <h2 className={shared.heading}>Anggota kelompok</h2>
          <span className={styles.quiet}>
            Kelas akademik dapat berbeda dari kelompok pengasuhan
          </span>
        </div>
        {group.members.length === 0 ? (
          <p className={shared.empty}>Kelompok ini belum memiliki anggota.</p>
        ) : (
          <GroupMembersTable
            members={group.members}
            period={period}
            detailAddressOf={memberAddressOf}
          />
        )}
      </section>
    </>
  );
}
