import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readFitnessParams } from "@/features/fitness/fitness-address";
import {
  readFitnessList,
  readFitnessNumbers,
} from "@/features/fitness/fitness-board";
import { testYearOf } from "@/features/fitness/fitness-input";
import { readFitnessLimits } from "@/features/fitness/fitness-limits";
import { fitnessVisibleTo } from "@/features/fitness/fitness-readers";
import { FitnessScreen, ReadOnlyNote } from "@/features/fitness/fitness-screen";
import { ReadOnlyLimits } from "@/features/fitness/read-only-limits";

/**
 * The tab Penilaian jasmani. Each role sees the Aktif students its roles
 * that open the tab see: Ketua Program Studi those of their own program
 * only, Pengasuh their own mentees only. The others are told who enters
 * the scores.
 */
export default async function FitnessPage(
  props: PageProps<"/penilaian/jasmani">,
) {
  const opened = await openPage("penilaian", "jasmani");
  const { account } = opened;
  const tabs = { pagePath: "penilaian", tabs: opened.tabs, open: "jasmani" };
  const params = readFitnessParams(await props.searchParams);
  const db = database();
  const today = campusDay();
  const visible = fitnessVisibleTo(account);
  const inForce = await readFitnessLimits(db);
  const { limits } = inForce;
  const [numbers, list] = await Promise.all([
    readFitnessNumbers(db, visible, limits, today),
    readFitnessList(db, visible, limits, params),
  ]);
  const mayEnter = may(account.roles, "enter_fitness_scores");
  return (
    <FitnessScreen
      tabs={tabs}
      year={testYearOf(today)}
      numbers={numbers}
      limits={limits}
      params={params}
      list={list}
      manage={mayEnter ? null : <ReadOnlyNote />}
      limitsPart={<ReadOnlyLimits inForce={inForce} />}
    />
  );
}
