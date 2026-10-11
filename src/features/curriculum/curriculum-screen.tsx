import { database } from "@/db/database";
import { PageHead } from "@/ui/page-head";
import { BaseScorePanel } from "./base-score-panel";
import { changeNote } from "./change-note";
import { GradeScalePanel } from "./grade-scale-panel";
import { MainIndicatorsPanel } from "./main-indicators-panel";
import { readBaseScore, STARTING_BASE_SCORE } from "./stored-base-score";
import { readMainIndicators } from "./stored-main-indicators";

export async function CurriculumScreen({ mayChange }: { mayChange: boolean }) {
  const db = database();
  const [indicators, baseScore] = await Promise.all([
    readMainIndicators(db),
    readBaseScore(db),
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
      <GradeScalePanel />
    </>
  );
}
