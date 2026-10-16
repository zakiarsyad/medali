import type { Database } from "./connect";
import {
  SAMPLE_FITNESS_TESTS,
  type SampleFitnessTest,
  sampleTestDay,
} from "./sample-fitness-scores";
import { fitnessScores, fitnessTests } from "./schema";
import { type AddedGroup, studentIdsByNim } from "./seed-mentor-groups";
import { momentOf, sampleAccountOf } from "./seed-siku-adjustments";

function idOf(ids: Map<string, string>, nim: string): string {
  const id = ids.get(nim);
  if (id === undefined) {
    throw new Error(`A sample fitness test names the missing NIM ${nim}.`);
  }
  return id;
}

/** The sample group that holds every student of a sample test. */
function groupOf(groups: AddedGroup[], test: SampleFitnessTest): string {
  const nims = test.scores.map(([nim]) => nim);
  const group = groups.find(({ sample }) =>
    nims.every((nim) => sample.memberNims.includes(nim)),
  );
  if (!group) {
    throw new Error("A sample fitness test names students of no one group.");
  }
  return group.id;
}

/**
 * Adds the sample fitness test scores, each save for its sample group, as
 * the work of the sample Penilai Mahasiswa or Kepala Unit. The sample
 * students, accounts and groups must be there already. `today` is today
 * on campus.
 */
export async function addSampleFitnessScores(
  db: Database,
  groups: AddedGroup[],
  today: string,
  now: Date = new Date(),
): Promise<void> {
  const studentIds = await studentIdsByNim(db);
  const enterers = {
    assessor: await sampleAccountOf(db, "assessor"),
    head_of_unit: await sampleAccountOf(db, "head_of_unit"),
  };
  for (const test of SAMPLE_FITNESS_TESTS) {
    const id = crypto.randomUUID();
    const testedOn = sampleTestDay(today, test.when);
    await db.insert(fitnessTests).values({
      id,
      groupId: groupOf(groups, test),
      testedOn,
      enteredBy: enterers[test.enteredAs],
      enteredAt: momentOf(testedOn, now),
    });
    await db.insert(fitnessScores).values(
      test.scores.map(([nim, score]) => ({
        testId: id,
        studentId: idOf(studentIds, nim),
        score,
      })),
    );
  }
}
