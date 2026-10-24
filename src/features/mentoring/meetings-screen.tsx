import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { periodTitle } from "@/academic-periods/period-labels";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import { MEETINGS_PER_PERIOD } from "@/mentoring/meeting-ids";
import type { TabLinksProps } from "@/ui/tab-links";
import {
  type AttendanceGroup,
  groupToShow,
  listAttendanceGroups,
  mayFillInFor,
} from "./attendance-groups";
import { AttendancePanel } from "./attendance-panel";
import { AttendanceView } from "./attendance-view";
import {
  type GroupMember,
  listActiveMembers,
  readMarks,
  readMeetings,
} from "./group-meetings";
import { GroupPicker } from "./group-picker";
import { type GroupChoice, groupChoiceOf } from "./group-search";
import { MeetingCards } from "./meeting-cards";
import { MeetingNumbers } from "./meeting-numbers";
import {
  MEETINGS_ADDRESS,
  type MeetingsParams,
  meetingsAddress,
} from "./meetings-address";
import {
  type KeptList,
  keptListOf,
  meetingsOverview,
} from "./meetings-overview";
import styles from "./mentoring.module.css";
import { MentoringHead } from "./mentoring-head";

/** The numbers and the cards of one group in the running period. */
async function GroupMeetings({
  group,
  period,
  mayFillIn,
  openNumber,
}: {
  group: GroupChoice;
  period: AcademicPeriod;
  /** Whether the account may fill in the lists of this group. */
  mayFillIn: boolean;
  /** The meeting whose attendance list is open, or null for none. */
  openNumber: number | null;
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
      <MeetingCards
        cards={overview.cards}
        groupId={group.id}
        mayFillIn={mayFillIn}
      />
      {openNumber !== null && (
        <OpenList
          groupId={group.id}
          period={period}
          number={openNumber}
          members={members}
          kept={keptListOf(openNumber, meetings, marks)}
          mayFillIn={mayFillIn}
        />
      )}
    </>
  );
}

/**
 * The attendance list the address opens: the form for an account that
 * may fill in for the group, and the saved list to read for any other.
 * An account that only reads is shown nothing of a meeting without a list.
 */
function OpenList({
  groupId,
  period,
  number,
  members,
  kept,
  mayFillIn,
}: {
  groupId: string;
  period: AcademicPeriod;
  number: number;
  members: GroupMember[];
  kept: KeptList | null;
  mayFillIn: boolean;
}) {
  if (mayFillIn) {
    return (
      <AttendancePanel
        groupId={groupId}
        period={period}
        number={number}
        members={members}
        kept={kept}
      />
    );
  }
  if (kept === null) return null;
  return (
    <AttendanceView
      number={number}
      members={members}
      kept={kept}
      closeAddress={meetingsAddress(groupId)}
    />
  );
}

/** What the tab shows under its head, for the groups an account may read. */
function Groups({
  groups,
  period,
  fillLimit,
  params,
}: {
  groups: AttendanceGroup[];
  period: AcademicPeriod | null;
  /** The groups the account may fill in for, or null for one that only reads. */
  fillLimit: RowLimit | null;
  params: MeetingsParams;
}) {
  const [first] = groups;
  if (first === undefined) {
    return (
      <p className={styles.quiet}>
        {fillLimit !== null
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
  const shown = groupToShow(groups, params.groupId) ?? first;
  const chosen = groupChoiceOf(shown);
  return (
    <>
      {groups.length > 1 && (
        <GroupPicker
          key={chosen.id}
          tabAddress={MEETINGS_ADDRESS}
          groups={groups.map(groupChoiceOf)}
          chosen={chosen}
        />
      )}
      <GroupMeetings
        group={chosen}
        period={period}
        mayFillIn={mayFillInFor(fillLimit, shown.mentor?.id ?? null)}
        openNumber={params.number}
      />
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
      <MentoringHead
        tabs={tabs}
        lede={
          <>
            Pertemuan pengasuhan dilaksanakan {MEETINGS_PER_PERIOD} kali setiap
            semester. Pengasuh mengisi daftar hadir anak asuh di setiap
            pertemuan; kehadiran ini ikut dihitung dalam komponen kehadiran
            kegiatan pada nilai karakter.
          </>
        }
        readsOnly={fillLimit === null}
      />
      <div className={styles.meetings}>
        <Groups
          groups={groups}
          period={period}
          fillLimit={fillLimit}
          params={params}
        />
      </div>
    </>
  );
}
