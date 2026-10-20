import { randomUUID } from "node:crypto";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import type { RowLimit } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import { database } from "@/db/database";
import { PageHead } from "@/ui/page-head";
import { BaseScorePanel } from "./base-score-panel";
import { changeNote } from "./change-note";
import { GradeScalePanel } from "./grade-scale-panel";
import { TAHAP } from "./stages";
import { readBaseScore, STARTING_BASE_SCORE } from "./stored-base-score";
import { readMainIndicators } from "./stored-main-indicators";
import { readPpksActivities } from "./stored-ppks-activities";
import { readStageBreakdowns } from "./stored-stage-breakdowns";
import { readCohortCounts, readScoreGroups } from "./stored-student-numbers";
import { semesterCounts } from "./student-numbers";
import { TahapPanels } from "./tahap-panels";
import { tahapScores } from "./tahap-scores";

export async function CurriculumScreen({
  mayChange,
  mayManageActivities,
  limit,
}: {
  mayChange: boolean;
  mayManageActivities: boolean;
  /** The students whose scores the viewer may see. */
  limit: RowLimit;
}) {
  const db = database();
  const [
    indicators,
    baseScore,
    activities,
    breakdowns,
    period,
    cohorts,
    scoreGroups,
  ] = await Promise.all([
    readMainIndicators(db),
    readBaseScore(db),
    readPpksActivities(db),
    readStageBreakdowns(db),
    readRunningPeriod(db),
    readCohortCounts(db),
    readScoreGroups(db, visibleTo(limit)),
  ]);
  return (
    <>
      <PageHead title="Kurikulum pembangunan karakter">
        Indikator utama MEDALI menjadi acuan seluruh tahap. Setiap semester
        punya program kegiatan pembangunan karakter (PPKS) yang dipilih
        indikatornya dari indikator utama. Jadwal pelaksanaan diatur di menu
        Kegiatan karakter.
      </PageHead>
      <TahapPanels
        values={indicators.values}
        indicatorsVersion={indicators.version}
        indicatorNote={changeNote(
          indicators.changed,
          "Diperbarui",
          "Isi awal, dapat disesuaikan.",
        )}
        mayChange={mayChange}
        activities={activities}
        breakdowns={breakdowns.map(({ changed, ...shown }) => ({
          ...shown,
          note: changeNote(changed, "Diperbarui", "Isi awal."),
        }))}
        mayManageActivities={mayManageActivities}
        newActivityId={randomUUID()}
        semesterCounts={semesterCounts(cohorts, period)}
        scores={TAHAP.map(({ no }) => tahapScores(scoreGroups, period, no))}
      >
        <BaseScorePanel
          score={baseScore.score}
          note={changeNote(
            baseScore.changed,
            "Diatur",
            `Nilai awal ${STARTING_BASE_SCORE}.`,
          )}
          mayChange={mayChange}
        />
      </TahapPanels>
      <GradeScalePanel />
    </>
  );
}
