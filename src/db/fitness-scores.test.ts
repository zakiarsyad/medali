// Sample NIMs of this file: 9986200000 to 9986200099.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { STARTING_LIMITS } from "@/features/fitness/fitness-ids";
import {
  addTestActor,
  addTestGroup,
  addTestScores,
  addTestStudents,
} from "@/features/fitness/test-fitness";
import type { Database } from "./connect";
import { fitnessCategoryLimits, fitnessScores, fitnessTests } from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

type Setting = typeof fitnessCategoryLimits.$inferInsert;

function setting(setBy: string, more: Partial<Setting> = {}): Setting {
  return {
    excellentFrom: 90,
    goodFrom: 75,
    attentionFrom: 60,
    before: STARTING_LIMITS,
    replaces: null,
    setBy,
    setAt: new Date(),
    ...more,
  };
}

async function addSetting(db: Database, value: Setting): Promise<string> {
  const [added] = await db
    .insert(fitnessCategoryLimits)
    .values(value)
    .returning();
  if (!added) throw new Error("The setting was not added.");
  return added.id;
}

/** In a transaction of its own, so a refusal does not end the check's. */
function inOwnStep<Answer>(db: Database, step: (tx: Database) => Answer) {
  return db.transaction(async (tx) => step(tx));
}

async function addSavedScore(db: Database, score: number) {
  const kepala = await addTestActor(db, "Kepala Uji Tabel Jasmani", [
    "head_of_unit",
  ]);
  const { programId, studentIds } = await addTestStudents(
    db,
    "Prodi Uji Tabel Jasmani",
    ["9986200001"],
  );
  const [studentId = ""] = studentIds;
  const groupId = await addTestGroup(db, programId, studentIds);
  const testId = await addTestScores(db, kepala, {
    groupId,
    testedOn: "2026-10-12",
    enteredAt: new Date(),
    scores: [{ studentId, score }],
  });
  return { kepala, groupId, studentId, testId };
}

describe("a setting of Ambang skor", () => {
  it("keeps limits from 1 to 100 that go down", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addTestActor(db, "Kepala Uji Ambang", [
        "head_of_unit",
      ]);

      await expect(
        addSetting(
          db,
          setting(id, { excellentFrom: 100, goodFrom: 2, attentionFrom: 1 }),
        ),
      ).resolves.toEqual(expect.any(String));
    });
  });

  it.each<[string, Partial<Setting>]>([
    ["a limit above 100", { excellentFrom: 101 }],
    ["a limit of 0", { attentionFrom: 0 }],
    ["Baik as high as Prima", { goodFrom: 90 }],
    ["Perlu perhatian above Baik", { attentionFrom: 76 }],
  ])("is refused with %s", async (_, more) => {
    await inTestDatabase(async (db) => {
      const { id } = await addTestActor(db, "Kepala Uji Ambang", [
        "head_of_unit",
      ]);

      await expect(
        inOwnStep(db, (tx) => addSetting(tx, setting(id, more))),
      ).rejects.toThrow();
    });
  });

  it("replaces another setting at most once, the starting limits among them", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addTestActor(db, "Kepala Uji Ambang", [
        "head_of_unit",
      ]);
      const first = await addSetting(db, setting(id));

      await expect(
        inOwnStep(db, (tx) => addSetting(tx, setting(id))),
      ).rejects.toThrow();
      await addSetting(db, setting(id, { replaces: first }));
      await expect(
        inOwnStep(db, (tx) => addSetting(tx, setting(id, { replaces: first }))),
      ).rejects.toThrow();
    });
  });

  it("cannot be changed, deleted or emptied", async () => {
    await inTestDatabase(async (db) => {
      const { id: setBy } = await addTestActor(db, "Kepala Uji Ambang", [
        "head_of_unit",
      ]);
      const id = await addSetting(db, setting(setBy));
      const thisOne = eq(fitnessCategoryLimits.id, id);

      await expect(
        inOwnStep(db, (tx) =>
          tx.update(fitnessCategoryLimits).set({ goodFrom: 80 }).where(thisOne),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) => tx.delete(fitnessCategoryLimits).where(thisOne)),
      ).rejects.toThrow();
      await expect(
        db.execute(sql`truncate fitness_category_limits`),
      ).rejects.toThrow();
    });
  });
});

describe("a fitness score", () => {
  it.each([0, 100])("keeps a score of %i", async (score) => {
    await inTestDatabase(async (db) => {
      const { studentId } = await addSavedScore(db, score);

      const kept = await db
        .select()
        .from(fitnessScores)
        .where(eq(fitnessScores.studentId, studentId));
      expect(kept).toEqual([expect.objectContaining({ score })]);
    });
  });

  it.each([-1, 101])("is refused with a score of %i", async (score) => {
    await inTestDatabase(async (db) => {
      await expect(
        inOwnStep(db, (tx) => addSavedScore(tx, score)),
      ).rejects.toThrow();
    });
  });

  it("is kept once per student in one save", async () => {
    await inTestDatabase(async (db) => {
      const { testId, studentId } = await addSavedScore(db, 80);

      await expect(
        inOwnStep(db, (tx) =>
          tx.insert(fitnessScores).values({ testId, studentId, score: 70 }),
        ),
      ).rejects.toThrow();
    });
  });

  it("cannot be changed, deleted or emptied, and neither can its save", async () => {
    await inTestDatabase(async (db) => {
      const { testId } = await addSavedScore(db, 80);
      const ofTest = eq(fitnessScores.testId, testId);
      const thisTest = eq(fitnessTests.id, testId);

      await expect(
        inOwnStep(db, (tx) =>
          tx.update(fitnessScores).set({ score: 90 }).where(ofTest),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) => tx.delete(fitnessScores).where(ofTest)),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) =>
          tx
            .update(fitnessTests)
            .set({ testedOn: "2026-10-11" })
            .where(thisTest),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) => tx.delete(fitnessTests).where(thisTest)),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) => tx.execute(sql`truncate fitness_scores`)),
      ).rejects.toThrow();
      await expect(
        db.execute(sql`truncate fitness_tests cascade`),
      ).rejects.toThrow();
    });
  });
});
