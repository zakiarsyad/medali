import Link from "next/link";
import { forbidden, notFound } from "next/navigation";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import shared from "@/ui/data-screen.module.css";
import { shownDay } from "@/ui/day";
import { PageHead } from "@/ui/page-head";
import { groupCode } from "./group-code";
import { type GroupDetail, readGroup } from "./group-detail";
import { GROUP_LIST_ADDRESS } from "./group-list-address";
import { GroupMembersTable } from "./group-members-table";
import { GroupMentorPanel } from "./group-mentor-panel";
import { GROUP_MIN, isSmallGroup } from "./group-size";
import { academicClasses, countedMembers } from "./member-rules";
import styles from "./mentor-groups.module.css";

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
  groupId,
  memberAddressOf,
}: {
  /** Which rows the account that opened the page may see. */
  limit: RowLimit;
  groupId: string;
  /**
   * The address that opens the detail of a member over this page, or null
   * for an account that may not open a student's detail.
   */
  memberAddressOf: ((studentId: string) => string) | null;
}) {
  const db = database();
  const [answer, period] = await Promise.all([
    readGroup(db, limit, groupId),
    readRunningPeriod(db),
  ]);
  if (answer.kind === "not_found") notFound();
  if (answer.kind === "refused") forbidden();
  const { group } = answer;
  return (
    <>
      <p className={styles.back}>
        <Link href={GROUP_LIST_ADDRESS} className={shared.link}>
          Semua kelompok pengasuhan
        </Link>
      </p>
      <PageHead title={groupCode(group)}>{groupLede(group)}</PageHead>
      {isSmallGroup(countedMembers(group.members)) && (
        <p className={styles.note}>
          Anggota aktif kelompok ini kurang dari {GROUP_MIN} karena sebagian
          anggota angkatannya sudah lulus, tidak aktif, atau jumlah penerimaan
          prodi kecil.
        </p>
      )}
      <GroupMentorPanel mentors={group.mentors} />
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
