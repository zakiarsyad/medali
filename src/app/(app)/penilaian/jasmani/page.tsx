import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readFitnessParams } from "@/features/fitness/fitness-address";
import {
  readFitnessList,
  readFitnessNumbers,
} from "@/features/fitness/fitness-board";
import { readFitnessGroupChoices } from "@/features/fitness/fitness-groups";
import { testYearOf } from "@/features/fitness/fitness-input";
import { FitnessInputPanel } from "@/features/fitness/fitness-input-panel";
import {
  fitnessVisibleTo,
  healthReadableTo,
} from "@/features/fitness/fitness-readers";
import { FitnessScreen, ReadOnlyNote } from "@/features/fitness/fitness-screen";
import { HealthPart } from "@/features/fitness/health-part";
import { readHealthRecap } from "@/features/fitness/health-recap";
import { mayWriteNotes } from "@/features/fitness/health-subject";
import { LimitsForm } from "@/features/fitness/limits-form";
import { ReadOnlyLimits } from "@/features/fitness/read-only-limits";
import { readRecapParams } from "@/features/fitness/recap-address";
import { ScoreForm } from "@/features/fitness/score-form";
import { readFitnessLimits } from "@/health-notes/fitness-limits";

/**
 * The tab Penilaian jasmani. Each role sees the Aktif students its roles
 * that open the tab see: Ketua Program Studi those of their own program
 * only, Pengasuh their own mentees only. The others are told who enters
 * the scores. Kepala Unit, with the right "Bobot penilaian", alone
 * changes "Ambang skor"; every other role reads it. Kepala Unit and
 * Penilai Mahasiswa write health notes of non-dorm students. Every
 * category is the final one; the note and its mark show only on the
 * rows whose notes the account reads. Kepala Unit alone reads "Rekap
 * data kesehatan seluruh mahasiswa", and each reading is logged.
 */
export default async function FitnessPage(
  props: PageProps<"/penilaian/jasmani">,
) {
  const opened = await openPage("penilaian", "jasmani");
  const { account } = opened;
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "jasmani" };
  const searchParams = await props.searchParams;
  const params = readFitnessParams(searchParams);
  const recapParams = readRecapParams(searchParams);
  const db = database();
  const today = campusDay();
  const visible = fitnessVisibleTo(account);
  const inForce = await readFitnessLimits(db);
  const { limits } = inForce;
  const mayEnter = may(account.roles, "enter_fitness_scores");
  const showsNotes = may(account.roles, "view_health_notes");
  const readable = healthReadableTo(account);
  const [numbers, list, groups, recap] = await Promise.all([
    readFitnessNumbers(db, visible, limits, today),
    readFitnessList(db, visible, limits, params, readable),
    mayEnter ? readFitnessGroupChoices(db) : [],
    readHealthRecap(db, account, recapParams, limits, today),
  ]);
  const maySetLimits = may(account.roles, "set_grade_weights");
  return (
    <FitnessScreen
      tabs={tabs}
      year={testYearOf(today)}
      numbers={numbers}
      limits={limits}
      params={params}
      list={list}
      showsNotes={showsNotes}
      manage={
        mayEnter ? (
          <FitnessInputPanel
            today={today}
            form={
              <ScoreForm
                groups={groups}
                today={today}
                limits={limits}
                newKey={crypto.randomUUID()}
              />
            }
          />
        ) : (
          <ReadOnlyNote />
        )
      }
      limitsPart={
        maySetLimits ? (
          <LimitsForm inForce={inForce} />
        ) : (
          <ReadOnlyLimits inForce={inForce} />
        )
      }
      health={
        <HealthPart
          recap={recap}
          list={params}
          recapParams={recapParams}
          writesNotes={mayWriteNotes(account.roles)}
          today={today}
        />
      }
    />
  );
}
