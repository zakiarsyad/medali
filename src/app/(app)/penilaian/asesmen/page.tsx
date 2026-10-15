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
import {
  AssessmentForm,
  type LevelTexts,
} from "@/features/character-assessment/assessment-form";
import { assessmentVisibleTo } from "@/features/character-assessment/assessment-readers";
import {
  AssessmentScreen,
  ReadOnlyNote,
} from "@/features/character-assessment/assessment-screen";
import { readMainIndicators } from "@/features/curriculum/stored-main-indicators";

/**
 * The tab Asesmen karakter. Each role sees the students its roles that
 * open the tab see: Ketua Program Studi those of their own program only,
 * Pengasuh their own mentees only. Kepala Unit and Penilai Mahasiswa may
 * also enter an assessment; the others are told who does.
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
  const running = await readRunningPeriod(db);
  const [numbers, list] = await Promise.all([
    readAssessmentNumbers(db, visible, running?.id ?? null),
    readAssessmentList(db, visible, params),
  ]);
  return (
    <AssessmentScreen
      tabs={tabs}
      params={params}
      numbers={numbers}
      periodName={running ? periodTitle(running) : null}
      list={list}
      manage={
        may(account.roles, "assess_character") ? (
          <AssessmentForm
            newAssessmentId={crypto.randomUUID()}
            levelTexts={await readLevelTexts(db)}
          />
        ) : (
          <ReadOnlyNote />
        )
      }
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
