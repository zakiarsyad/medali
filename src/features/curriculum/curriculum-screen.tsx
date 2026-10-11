import { database } from "@/db/database";
import { PageHead } from "@/ui/page-head";
import { BaseScorePanel } from "./base-score-panel";
import { changeNote } from "./change-note";
import { GradeScalePanel } from "./grade-scale-panel";
import { MainIndicatorsPanel } from "./main-indicators-panel";
import { StagesSection } from "./stages-section";
import { readBaseScore, STARTING_BASE_SCORE } from "./stored-base-score";
import { readMainIndicators } from "./stored-main-indicators";
import { readPpksActivities } from "./stored-ppks-activities";

export async function CurriculumScreen({
  mayChange,
  mayManageActivities,
}: {
  mayChange: boolean;
  mayManageActivities: boolean;
}) {
  const db = database();
  const [indicators, baseScore, activities] = await Promise.all([
    readMainIndicators(db),
    readBaseScore(db),
    readPpksActivities(db),
  ]);
  return (
    <>
      <PageHead title="Kurikulum pembangunan karakter">
        Indikator utama MEDALI menjadi acuan seluruh tahap. Setiap semester
        punya program kegiatan pembangunan karakter (PPKS) yang dipilih
        indikatornya dari indikator utama. Jadwal pelaksanaan diatur di menu
        Kegiatan karakter.
      </PageHead>
      <MainIndicatorsPanel
        values={indicators.values}
        note={changeNote(
          indicators.changed,
          "Diperbarui",
          "Isi awal, dapat disesuaikan.",
        )}
        mayChange={mayChange}
      />
      <BaseScorePanel
        score={baseScore.score}
        note={changeNote(
          baseScore.changed,
          "Diatur",
          `Nilai awal ${STARTING_BASE_SCORE}.`,
        )}
        mayChange={mayChange}
      />
      <StagesSection
        activities={activities}
        values={indicators.values}
        mayManage={mayManageActivities}
      />
      <GradeScalePanel />
    </>
  );
}
