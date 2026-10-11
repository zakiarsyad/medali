import { database } from "@/db/database";
import { PageHead } from "@/ui/page-head";
import { BaseScorePanel } from "./base-score-panel";
import { changeNote } from "./change-note";
import { GradeScalePanel } from "./grade-scale-panel";
import { readBaseScore, STARTING_BASE_SCORE } from "./stored-base-score";
import { readMainIndicators } from "./stored-main-indicators";
import { readPpksActivities } from "./stored-ppks-activities";
import { readStageBreakdowns } from "./stored-stage-breakdowns";
import { TahapPanels } from "./tahap-panels";

export async function CurriculumScreen({
  mayChange,
  mayManageActivities,
}: {
  mayChange: boolean;
  mayManageActivities: boolean;
}) {
  const db = database();
  const [indicators, baseScore, activities, breakdowns] = await Promise.all([
    readMainIndicators(db),
    readBaseScore(db),
    readPpksActivities(db),
    readStageBreakdowns(db),
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
