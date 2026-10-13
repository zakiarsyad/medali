import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { periodTitle } from "@/academic-periods/period-labels";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import { MEETINGS_PER_PERIOD } from "@/mentoring/meeting-ids";
import { groupCode } from "@/ui/group-code";
import { mentorLabel } from "@/ui/mentor-label";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import {
  type AttendanceGroup,
  listAttendanceGroups,
} from "./attendance-groups";
import { listActiveMembers, readMarks, readMeetings } from "./group-meetings";
import { GroupPicker } from "./group-picker";
import type { GroupChoice } from "./group-search";
import { MeetingCards } from "./meeting-cards";
import { MeetingNumbers } from "./meeting-numbers";
import type { MeetingsParams } from "./meetings-address";
import { meetingsOverview } from "./meetings-overview";
import styles from "./mentoring.module.css";
import { ReadOnlyLine } from "./read-only-line";

const NO_MENTOR = "-";

function choiceOf(group: AttendanceGroup): GroupChoice {
  return {
    id: group.id,
    code: groupCode(group),
    mentor: group.mentor ? mentorLabel(group.mentor) : NO_MENTOR,
  };
}

/** The numbers and the cards of one group in the running period. */
async function GroupMeetings({
  group,
  period,
}: {
  group: GroupChoice;
  period: AcademicPeriod;
}) {
  const db = database();
  const [members, meetings] = await Promise.all([
    listActiveMembers(db, group.id),
    readMeetings(db, group.id, period.id),
  ]);
  const marks = await readMarks(
    db,
    meetings.map((meeting) => meeting.id),
  );
  const overview = meetingsOverview(
    members.map((member) => member.id),
    meetings,
    marks,
  );
  return (
    <>
      <MeetingNumbers
        held={overview.held}
        periodTitle={periodTitle(period)}
        members={members.length}
        groupCode={group.code}
        average={overview.average}
        mentor={group.mentor}
      />
      <MeetingCards cards={overview.cards} />
    </>
  );
}

/** What the tab shows under its head, for the groups an account may read. */
function Groups({
  groups,
  period,
  mayFillIn,
  params,
}: {
  groups: AttendanceGroup[];
  period: AcademicPeriod | null;
  /** Whether the account has the right to fill in at all. */
  mayFillIn: boolean;
  params: MeetingsParams;
}) {
  const [first] = groups;
  if (first === undefined) {
    return (
      <p className={styles.quiet}>
        {mayFillIn
          ? "Anda belum memegang kelompok pengasuhan."
          : "Belum ada kelompok pengasuhan yang dapat Anda lihat."}
      </p>
    );
  }
  if (period === null) {
    return (
      <p className={styles.quiet}>
        Belum ada periode akademik yang berjalan, sehingga daftar hadir
        pertemuan belum dapat diisi. Periode akademik diatur oleh Kepala Unit di
        Pengaturan.
      </p>
    );
  }
  // An address that names no group the account may read shows the first.
  const shown = groups.find((group) => group.id === params.groupId) ?? first;
  const chosen = choiceOf(shown);
  return (
    <>
      {groups.length > 1 && (
        <GroupPicker
          key={chosen.id}
          groups={groups.map(choiceOf)}
          chosen={chosen}
        />
      )}
      <GroupMeetings group={chosen} period={period} />
    </>
  );
}

/** The tab "Pertemuan dan daftar hadir". */
export async function MeetingsScreen({
  tabs,
  limit,
  fillLimit,
  params,
}: {
  tabs: TabLinksProps;
  /** The groups whose meetings the account that opened the tab may read. */
  limit: RowLimit;
  /**
   * The groups the account may fill in for, or null for an account that
   * only reads.
   */
  fillLimit: RowLimit | null;
  params: MeetingsParams;
}) {
  const db = database();
  const [groups, period] = await Promise.all([
    listAttendanceGroups(db, limit),
    readRunningPeriod(db),
  ]);
  return (
    <>
      <PageHead title="Pengasuhan">
        Pertemuan pengasuhan dilaksanakan {MEETINGS_PER_PERIOD} kali setiap
        semester. Pengasuh mengisi daftar hadir anak asuh di setiap pertemuan;
        kehadiran ini ikut dihitung dalam komponen kehadiran kegiatan pada nilai
        karakter.
      </PageHead>
      <TabLinks {...tabs} />
      {fillLimit === null && <ReadOnlyLine />}
      <Groups
        groups={groups}
        period={period}
        mayFillIn={fillLimit !== null}
        params={params}
      />
    </>
  );
}
