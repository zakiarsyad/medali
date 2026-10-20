import { eq, isNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { fitnessCategoryLimits } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { STARTING_VERSION } from "@/health-notes/fitness-ids";
import { readFitnessLimits } from "@/health-notes/fitness-limits";
import { saveFitnessLimits } from "./save-fitness-limits";
import { addTestActor } from "./test-fitness";

/*
 * A setting of the limits is never erased, so no rows are removed after
 * the check: the database is dropped at the end. Each check starts from
 * the limits the one before it left in force.
 */
const own = withOwnTestDatabase("ambangskor");

const SAVED = { ok: true, value: null };

async function settingsReplacing(version: string) {
  const replaced =
    version === STARTING_VERSION
      ? isNull(fitnessCategoryLimits.replaces)
      : eq(fitnessCategoryLimits.replaces, version);
  return own.db.select().from(fitnessCategoryLimits).where(replaced);
}

async function settingCount(): Promise<number> {
  return (await own.db.select().from(fitnessCategoryLimits)).length;
}

describe("Simpan ambang pressed by two people at the same moment", () => {
  it("keeps the first: the second waits, then is told who changed the limits", async () => {
    const ani = await addTestActor(own.db, "Kepala Ani", ["head_of_unit"]);
    const budi = await addTestActor(own.db, "Kepala Budi", ["head_of_unit"]);
    const { version } = await readFitnessLimits(own.db);
    const before = await settingCount();

    const both = await own.atOnce(
      (db) =>
        saveFitnessLimits(
          db,
          ani,
          { excellentFrom: "85", goodFrom: "75", attentionFrom: "55" },
          version,
        ),
      (db) =>
        saveFitnessLimits(
          db,
          budi,
          { excellentFrom: "90", goodFrom: "80", attentionFrom: "60" },
          version,
        ),
    );

    expect(both.sooner).toEqual(SAVED);
    expect(both.later).toEqual({
      ok: false,
      error: "Ambang sudah diubah oleh Kepala Ani. Muat ulang.",
    });
    expect(await settingCount()).toBe(before + 1);
    const inForce = await readFitnessLimits(own.db);
    expect(inForce.limits.goodFrom).toBe(75);
    expect(inForce.set?.by).toBe("Kepala Ani");
  });
});

describe("Simpan ambang pressed twice on one form at the same moment", () => {
  it("saves once, and says it is saved both times", async () => {
    const ani = await addTestActor(own.db, "Kepala Ani", ["head_of_unit"]);
    const { version } = await readFitnessLimits(own.db);
    const sent = { excellentFrom: "88", goodFrom: "72", attentionFrom: "50" };

    const both = await own.atOnce(
      (db) => saveFitnessLimits(db, ani, sent, version),
      (db) => saveFitnessLimits(db, ani, sent, version),
    );

    expect(both).toEqual({ sooner: SAVED, later: SAVED });
    const saved = await settingsReplacing(version);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ excellentFrom: 88, attentionFrom: 50 });
  });
});
