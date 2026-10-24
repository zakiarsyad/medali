import type { SQL } from "drizzle-orm";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import { periodTitle } from "@/academic-periods/period-labels";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import type { RowLimit } from "@/auth/access";
import { database } from "@/db/database";
import { SCORE_MAX, SCORE_MIN } from "@/mentoring/score-range";
import shared from "@/ui/data-screen.module.css";
import type { TabLinksProps } from "@/ui/tab-links";
import {
  type AttendanceGroup,
  groupToShow,
  listAttendanceGroups,
  mayFillInFor,
} from "./attendance-groups";
import { readMarks, readMeetings } from "./group-meetings";
import { GroupPicker } from "./group-picker";
import { listScoredMembers } from "./group-scores";
import { groupChoiceOf } from "./group-search";
import { IndicatorPanel } from "./indicator-panel";
import { readIndicators } from "./indicator-set";
import styles from "./mentoring.module.css";
import { MentoringHead } from "./mentoring-head";
import { ScoreForm } from "./score-form";
import { ScoreList } from "./score-list";
import { ScoreNumbers } from "./score-numbers";
import { type ScoreRow, scoreRowsOf } from "./score-rows";
import { ScoreRubric } from "./score-rubric";
import { SCORES_ADDRESS, type ScoresParams } from "./scores-address";
import { scoresOverview } from "./scores-overview";

/** The numbers, the rubric and the scores of one group in the running period. */
async function GroupScores({
  groupId,
  period,
  mayGive,
  detailVisible,
}: {
  groupId: string;
  period: AcademicPeriod;
  /** Whether the account may give the scores of this group. */
  mayGive: boolean;
  detailVisible: SQL | null;
}) {
  const db = database();
  const [members, meetings] = await Promise.all([
    listScoredMembers(db, groupId, period.id, detailVisible),
    readMeetings(db, groupId, period.id),
  ]);
  const marks = await readMarks(
    db,
    meetings.map((meeting) => meeting.id),
  );
  const rows = scoreRowsOf(groupId, members, marks);
  const overview = scoresOverview(rows.map((row) => row.score));
  return (
    <>
      <ScoreNumbers overview={overview} held={meetings.length} />
      <section className={shared.panel}>
        <div className={styles.panelHead}>
          <h2 className={shared.heading}>Nilai anak asuh</h2>
          <span className={styles.quiet}>
            Skala {SCORE_MIN}–{SCORE_MAX}
          </span>
        </div>
        <ScoreRubric />
        <Scores groupId={groupId} rows={rows} mayGive={mayGive} />
      </section>
    </>
  );
}

/**
 * "Nilai anak asuh" of one group: the form for the account that may give
 * its scores, and the saved scores to read for any other.
 */
function Scores({
  groupId,
  rows,
  mayGive,
}: {
  groupId: string;
  rows: ScoreRow[];
  mayGive: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className={styles.quiet}>
        Kelompok ini belum memiliki anak asuh aktif.
      </p>
    );
  }
  if (!mayGive) return <ScoreList rows={rows} />;
  // Made anew for each group, so nothing typed for one stays for another.
  return <ScoreForm key={groupId} groupId={groupId} rows={rows} />;
}

/** What the tab shows under its head, for the groups an account may read. */
function Groups({
  groups,
  period,
  giveLimit,
  detailVisible,
  askedGroupId,
}: {
  groups: AttendanceGroup[];
  period: AcademicPeriod | null;
  /** The groups the account may give scores in, or null for one that only reads. */
  giveLimit: RowLimit | null;
  detailVisible: SQL | null;
  askedGroupId: string | null;
}) {
  const [first] = groups;
  if (first === undefined) {
    return (
      <p className={styles.quiet}>
        {giveLimit !== null
          ? "Anda belum memegang kelompok pengasuhan."
          : "Belum ada kelompok pengasuhan yang dapat Anda lihat."}
      </p>
    );
  }
  if (period === null) {
    return (
      <p className={styles.quiet}>
        Belum ada periode akademik yang berjalan, sehingga nilai pengasuhan
        belum dapat diisi. Periode akademik diatur oleh Kepala Unit di
        Pengaturan.
      </p>
    );
  }
  const shown = groupToShow(groups, askedGroupId) ?? first;
  const chosen = groupChoiceOf(shown);
  return (
    <>
      {groups.length > 1 && (
        <GroupPicker
          key={chosen.id}
          tabAddress={SCORES_ADDRESS}
          groups={groups.map(groupChoiceOf)}
          chosen={chosen}
        />
      )}
      <GroupScores
        groupId={shown.id}
        period={period}
        mayGive={mayFillInFor(giveLimit, shown.mentor?.id ?? null)}
        detailVisible={detailVisible}
      />
    </>
  );
}

/** The sentence under the title, which names the running period when there is one. */
function Intro({ period }: { period: AcademicPeriod | null }) {
  const semester =
    period === null ? "setiap semester" : `semester ${periodTitle(period)}`;
  return (
    <>
      Pengasuh wajib menilai setiap anak asuh pada {semester}. Nilai ini menjadi
      komponen nilai pengasuhan pada penilaian karakter KEP-220.
    </>
  );
}

/** The tab "Nilai pengasuhan". */
export async function ScoresScreen({
  tabs,
  limit,
  giveLimit,
  detailVisible,
  params,
}: {
  tabs: TabLinksProps;
  /** The groups whose scores the account that opened the tab may read. */
  limit: RowLimit;
  /**
   * The groups the account may give scores in, or null for an account
   * that only reads.
   */
  giveLimit: RowLimit | null;
  /** The students whose detail the account may open, or null for none. */
  detailVisible: SQL | null;
  params: ScoresParams;
}) {
  const db = database();
  const [groups, period, indicators] = await Promise.all([
    listAttendanceGroups(db, limit),
    readRunningPeriod(db),
    readIndicators(db),
  ]);
  return (
    <>
      <MentoringHead
        tabs={tabs}
        lede={<Intro period={period} />}
        readsOnly={giveLimit === null}
      />
      <div className={styles.meetings}>
        <IndicatorPanel inForce={indicators} />
        <Groups
          groups={groups}
          period={period}
          giveLimit={giveLimit}
          detailVisible={detailVisible}
          askedGroupId={params.groupId}
        />
      </div>
    </>
  );
}
