import { periodTitle } from "@/academic-periods/period-labels";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import type { Database } from "@/db/connect";
import { database } from "@/db/database";
import { readAssessmentParams } from "@/features/character-assessment/assessment-address";
import {
  readAssessmentList,
  readAssessmentNumbers,
} from "@/features/character-assessment/assessment-board";
import type { LevelTexts } from "@/features/character-assessment/assessment-form";
import { readAssessmentHistory } from "@/features/character-assessment/assessment-history";
import { AssessmentHistoryDialog } from "@/features/character-assessment/assessment-history-dialog";
import { AssessmentInputPanel } from "@/features/character-assessment/assessment-input-panel";
import { assessmentVisibleTo } from "@/features/character-assessment/assessment-readers";
import {
  AssessmentScreen,
  ReadOnlyNote,
} from "@/features/character-assessment/assessment-screen";
import { readCoachingList } from "@/features/character-assessment/coaching-list";
import {
  CoachingPanel,
  type CounsellingCell,
} from "@/features/character-assessment/coaching-panel";
import { AssessmentCallCell } from "@/features/counselling/assessment-call-cell";
import {
  type AssessmentCall,
  readAssessmentCalls,
} from "@/features/counselling/assessment-calls";
import { readMainIndicators } from "@/features/curriculum/stored-main-indicators";

/**
 * The tab Asesmen karakter. Each role sees the students its roles that
 * open the tab see: Ketua Program Studi those of their own program only,
 * Pengasuh their own mentees only. Kepala Unit and Penilai Mahasiswa may
 * also enter an assessment, and alone read "Catatan penilai"; the others
 * are told who enters. "Teridentifikasi perlu pembinaan" lists, of the
 * same students, those whose latest assessment is low; only Penilai
 * Mahasiswa sees its column Konseling, with the calls read for it alone.
 * A student's earlier assessments open over the tab only for a student
 * the account sees.
 */
export default async function AssessmentPage(
  props: PageProps<"/penilaian/asesmen">,
) {
  const opened = await openPage("penilaian", "asesmen");
  const { account } = opened;
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "asesmen" };
  const params = readAssessmentParams(await props.searchParams);
  const db = database();
  const visible = assessmentVisibleTo(account);
  const mayAssess = may(account.roles, "assess_character");
  const running = await readRunningPeriod(db);
  const [numbers, coaching, list, history] = await Promise.all([
    readAssessmentNumbers(db, visible, running?.id ?? null),
    readCoachingList(db, visible, params),
    readAssessmentList(db, visible, params),
    params.historyId === null
      ? null
      : readAssessmentHistory(db, visible, params.historyId, mayAssess),
  ]);
  const calls = await readAssessmentCalls(
    db,
    account,
    coaching.rows.map((row) => row.id),
  );
  return (
    <>
      <AssessmentScreen
        tabs={tabs}
        params={params}
        numbers={numbers}
        periodName={running ? periodTitle(running) : null}
        list={list}
        coaching={
          <CoachingPanel
            list={coaching}
            params={params}
            counsellingCell={callCellsOf(calls)}
          />
        }
        manage={
          mayAssess ? (
            <AssessmentInputPanel
              newAssessmentId={crypto.randomUUID()}
              levelTexts={await readLevelTexts(db)}
            />
          ) : (
            <ReadOnlyNote />
          )
        }
      />
      {history && (
        <AssessmentHistoryDialog
          history={history}
          params={params}
          withNotes={mayAssess}
        />
      )}
    </>
  );
}

/** The column Konseling, or none for an account not given the calls. */
function callCellsOf(
  calls: Map<string, AssessmentCall> | null,
): CounsellingCell | null {
  if (calls === null) return null;
  return (row) => (
    <AssessmentCallCell
      studentId={row.id}
      name={row.name}
      call={calls.get(row.id)}
    />
  );
}

/** The main indicators of Kurikulum, which name the levels of each slider. */
async function readLevelTexts(db: Database): Promise<LevelTexts> {
  const { values } = await readMainIndicators(db);
  const texts: LevelTexts = { M: [], E: [], D: [], A: [], L: [], I: [] };
  for (const value of values) {
    texts[value.key] = value.indicators.map((indicator) => indicator.text);
  }
  return texts;
}
