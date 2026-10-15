import { eq, isNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { characterGradeSchemes } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { readGradeScheme } from "./grade-scheme";
import { saveGradeScheme } from "./save-grade-scheme";
import { STARTING_VERSION } from "./scheme-ids";
import { addTestActor, FORTY_TWENTY, sentWithWeights } from "./test-scheme";

/*
 * A setting of the scheme is never erased, so no rows are removed after
 * the check: the database is dropped at the end. Each check starts from
 * the scheme the one before it left in force.
 */
const own = withOwnTestDatabase("skemabobot");

const SAVED = { ok: true, value: null };

async function settingsReplacing(version: string) {
  const replaced =
    version === STARTING_VERSION
      ? isNull(characterGradeSchemes.replaces)
      : eq(characterGradeSchemes.replaces, version);
  return own.db.select().from(characterGradeSchemes).where(replaced);
}

async function settingCount(): Promise<number> {
  return (await own.db.select().from(characterGradeSchemes)).length;
}

describe("Simpan skema pressed by two people at the same moment", () => {
  it("keeps the first: the second waits, then is told who changed the scheme", async () => {
    const ani = await addTestActor(own.db, "Kepala Ani", ["head_of_unit"]);
    const budi = await addTestActor(own.db, "Kepala Budi", ["head_of_unit"]);
    const { version } = await readGradeScheme(own.db);
    const before = await settingCount();

    const both = await own.atOnce(
      (db) => saveGradeScheme(db, ani, sentWithWeights(FORTY_TWENTY), version),
      (db) =>
        saveGradeScheme(
          db,
          budi,
          sentWithWeights({ ...FORTY_TWENTY, attendance: 10, skpm: 50 }),
          version,
        ),
    );

    expect(both.sooner).toEqual(SAVED);
    expect(both.later).toEqual({
      ok: false,
      error: "Skema sudah diubah oleh Kepala Ani. Muat ulang.",
    });
    expect(await settingCount()).toBe(before + 1);
    const inForce = await readGradeScheme(own.db);
    expect(inForce.scheme.weights).toEqual(FORTY_TWENTY);
    expect(inForce.set?.by).toBe("Kepala Ani");
  });
});

describe("Simpan skema pressed twice on one form at the same moment", () => {
  it("saves once, and says it is saved both times", async () => {
    const ani = await addTestActor(own.db, "Kepala Ani", ["head_of_unit"]);
    const { version } = await readGradeScheme(own.db);
    const sent = sentWithWeights({ ...FORTY_TWENTY, siku: 30, skpm: 10 });

    const both = await own.atOnce(
      (db) => saveGradeScheme(db, ani, sent, version),
      (db) => saveGradeScheme(db, ani, sent, version),
    );

    expect(both).toEqual({ sooner: SAVED, later: SAVED });
    const saved = await settingsReplacing(version);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ sikuWeight: 30, skpmWeight: 10 });
  });
});
