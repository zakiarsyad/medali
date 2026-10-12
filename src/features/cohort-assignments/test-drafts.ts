import { eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { cohortAssignments } from "@/db/schema";
import { fillDraftMentors } from "./fill-draft-mentors";
import { formAssignment } from "./form-assignment";
import {
  type DraftGroup,
  readAssignment,
  type StoredAssignment,
} from "./stored-assignment";
import {
  addTestActor,
  addTestMentor,
  addTestProgram,
  addTestStudents,
  type TestActor,
} from "./test-records";
import { EVERY_ROW } from "./visible-assignments";

/** A made-up draft for the checks of the changes to a draft. */
export interface TestDraft {
  /** The Pegawai UPK who formed the groups. */
  actor: TestActor;
  /** The program studi with two groups of 30, named `<tag> Pajak`. */
  large: number;
  /** The program studi with one group of 20, named `<tag> Akuntansi`. */
  small: number;
}

/**
 * Forms the groups of an angkatan of 60 students in one program studi
 * and 20 in another, by NIM. The NIMs start at `99<yy>000001`.
 */
export async function addTestDraft(
  db: Database,
  cohortYear: number,
  tag: string,
): Promise<TestDraft> {
  const firstNim = Number(`99${String(cohortYear).slice(2)}000001`);
  const large = await addTestProgram(db, `${tag} Pajak`);
  const small = await addTestProgram(db, `${tag} Akuntansi`);
  await addTestStudents(db, large, 60, firstNim, { cohortYear });
  await addTestStudents(db, small, 20, firstNim + 100, { cohortYear });
  const actor = await addTestActor(db, ["upk_staff"], `Pegawai ${tag}`);
  const formed = await formAssignment(db, actor, {
    cohortYear,
    targetSize: 30,
    method: "by_nim",
    version: 0,
  });
  if (!formed.ok) throw new Error(formed.error);
  return { actor, large, small };
}

/**
 * The same draft with a mentor of its own chosen for each of its three
 * groups, which leaves it at version 2: one that may be submitted and
 * fixed.
 */
export async function addCompleteTestDraft(
  db: Database,
  cohortYear: number,
  tag: string,
): Promise<TestDraft> {
  const draft = await addTestDraft(db, cohortYear, tag);
  for (const name of ["Adi", "Budi", "Citra"]) {
    await addTestMentor(db, { name: `Pengasuh ${tag} ${name}` });
  }
  const filled = await fillDraftMentors(db, draft.actor, {
    cohortYear,
    version: 1,
  });
  if (!filled.ok) throw new Error(filled.error);
  return draft;
}

export async function testDraftOf(
  db: Database,
  cohortYear: number,
): Promise<StoredAssignment> {
  const draft = await readAssignment(db, EVERY_ROW, cohortYear);
  if (!draft) throw new Error("The angkatan has no penetapan.");
  return draft;
}

/** The groups of a draft that are of one program studi, by number. */
export async function testGroupsOf(
  db: Database,
  cohortYear: number,
  studyProgramId: number,
): Promise<DraftGroup[]> {
  const draft = await testDraftOf(db, cohortYear);
  return draft.groups.filter(
    (group) => group.studyProgramId === studyProgramId,
  );
}

/** Makes the penetapan of an angkatan a fixed one. */
export async function fixTestDraft(
  db: Database,
  cohortYear: number,
): Promise<void> {
  await db
    .update(cohortAssignments)
    .set({
      status: "fixed",
      decreeNumber: "KEP-UJI/2041",
      effectiveOn: "2041-09-01",
    })
    .where(eq(cohortAssignments.cohortYear, cohortYear));
}
