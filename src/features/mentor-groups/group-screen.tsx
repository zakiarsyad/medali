import type { SQL } from "drizzle-orm";
import Link from "next/link";
import { forbidden } from "next/navigation";
import type { ReactNode } from "react";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { groupCode } from "@/ui/group-code";
import { GROUP_MIN, isSmallGroup } from "@/ui/group-size";
import { ListPager } from "@/ui/list-pager";
import { PAGE_SIZE } from "@/ui/list-pages";
import { PageHead } from "@/ui/page-head";
import { listGroupEvaluations } from "./evaluation-rows";
import { EvaluationTable } from "./evaluation-table";
import type { GroupDetail } from "./group-detail";
import { GroupHeadActions } from "./group-head-actions";
import { GROUP_LIST_ADDRESS, groupAddress } from "./group-list-address";
import { GroupMembersTable } from "./group-members-table";
import { GroupMentorPanel } from "./group-mentor-panel";
import { readGroupPage } from "./group-page";
import { readMemberScores } from "./member-scores";
import styles from "./mentor-groups.module.css";
import { currentMentor } from "./mentor-history";
import type { MentorAddressOf } from "./open-mentor-address";
import { scheduledWords } from "./replacement-words";
import { ScoresPanel } from "./scores-panel";
import { readWaitingReplacementOf } from "./waiting-replacement-of";

/** The line under the code: whose group it is, since when, and how large. */
function groupLede(group: GroupDetail): string {
  const path = group.entryPath === "transfer" ? " jalur alih program" : "";
  const whose = `${group.studyProgram} angkatan ${group.cohortYear}${path}`;
  const formed = `dibentuk saat masuk pada ${shownDay(group.startsOn)}`;
  const size = `${group.memberCounts.counted} mahasiswa aktif`;
  const classes = `${group.memberCounts.classes} kelas akademik`;
  return `Kelompok pengasuhan ${whose}, ${formed}. ${size}, saat ini tersebar di ${classes}.`;
}

/**
 * The page of one group. An address that names no group gets
 * `whenNotFound`; a group outside the account's rows is refused aloud.
 */
export async function GroupScreen({
  limit,
  evaluationLimit,
  evaluateAddress,
  replaceAddress,
  groupId,
  memberPage,
  detailVisible,
  memberAddressOf,
  mentorAddressOf,
  whenNotFound,
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
  /** The page of "Anggota kelompok" the address asks for. */
  memberPage: number;
  /** The students whose detail the account may open, or null for none. */
  detailVisible: SQL | null;
  /**
   * The address that opens the detail of a member over this page, or null
   * for an account that may not open a student's detail.
   */
  memberAddressOf: ((studentId: string) => string) | null;
  mentorAddressOf: MentorAddressOf;
  /** What shows instead when the address names no group. */
  whenNotFound: ReactNode;
}) {
  const db = database();
  const [answer, period] = await Promise.all([
    readGroupPage(db, limit, groupId, detailVisible, memberPage),
    readRunningPeriod(db),
  ]);
  if (answer.kind === "not_found") return whenNotFound;
  if (answer.kind === "refused") forbidden();
  const { group, recentNotes, needsCoaching } = answer;
  // Read once the group is found: its id is then known to be one.
  const [evaluations, waiting, scores] = await Promise.all([
    evaluationLimit === null
      ? null
      : listGroupEvaluations(db, evaluationLimit, group.id),
    readWaitingReplacementOf(db, group.id),
    readMemberScores(
      db,
      group.members.map((member) => member.id),
    ),
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
      {isSmallGroup(group.memberCounts.counted) && (
        <p className={styles.note}>
          Anggota aktif kelompok ini kurang dari {GROUP_MIN} karena sebagian
          anggota angkatannya sudah lulus, tidak aktif, atau jumlah penerimaan
          prodi kecil.
        </p>
      )}
      {waiting !== null && (
        <p className={styles.warnedNote}>{scheduledWords(waiting)}</p>
      )}
      <div className={styles.sideBySide}>
        <GroupMentorPanel
          mentors={group.mentors}
          mentorAddress={mentor && mentorAddressOf(mentor.mentorId, group)}
          recentNotes={recentNotes}
          needsCoaching={needsCoaching}
        />
        <ScoresPanel title="Rerata kelompok" summary={group.summary} withBar />
      </div>
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
        {group.memberCounts.listed === 0 ? (
          <p className={shared.empty}>Kelompok ini belum memiliki anggota.</p>
        ) : (
          <GroupMembersTable
            members={group.members}
            period={period}
            scores={scores}
            detailAddressOf={memberAddressOf}
          />
        )}
        {group.memberCounts.listed > PAGE_SIZE && (
          <ListPager
            page={group.memberPage}
            matching={group.memberCounts.listed}
            noun="anggota"
            keepsPlace
            addressOf={(page) => groupAddress(group.id, page)}
          />
        )}
      </section>
    </>
  );
}
