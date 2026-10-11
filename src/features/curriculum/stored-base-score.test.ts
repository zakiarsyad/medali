import { describe, expect, it } from "vitest";
import { sikuBaseScore } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readBaseScore } from "./stored-base-score";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

describe("readBaseScore", () => {
  it("gives 65, set by nobody, while no score is saved", async () => {
    await inTestDatabase(async (db) => {
      expect(await readBaseScore(db)).toEqual({ score: 65, changed: null });
    });
  });

  it("gives the saved score with who set it and when", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      const setAt = new Date("2026-03-01T03:00:00Z");
      await db
        .insert(sikuBaseScore)
        .values({ score: 70, setAt, setBy: actor.id });

      expect(await readBaseScore(db)).toEqual({
        score: 70,
        changed: { at: setAt, by: "Kepala Uji" },
      });
    });
  });

  it("keeps one score only", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      const row = { score: 70, setAt: new Date(), setBy: actor.id };
      await db.insert(sikuBaseScore).values(row);

      await expect(
        db.insert(sikuBaseScore).values({ ...row, id: 2 }),
      ).rejects.toThrow();
    });
  });
});
