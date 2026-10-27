import { describe, expect, it } from "vitest";
import { mentoringIndicatorSets } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import {
  type ScoreIndicator,
  STARTING_INDICATORS,
} from "@/mentoring/score-indicators";
import { readIndicators } from "./indicator-set";
import { saveIndicators } from "./save-indicators";
import { addTestAccount } from "./test-records";

/*
 * A setting of the indicators is never erased, so no rows are removed
 * after the check: the database is dropped at the end. Each check starts
 * from the indicators the one before it left in force.
 */
const own = withOwnTestDatabase("indikatorasuh");

const SAVED = { ok: true, value: null };

function withFirst(name: string): ScoreIndicator[] {
  return STARTING_INDICATORS.map((indicator, place) =>
    place === 0 ? { ...indicator, name } : indicator,
  );
}

async function settingCount(): Promise<number> {
  return (await own.db.select().from(mentoringIndicatorSets)).length;
}

describe("Simpan indikator pressed by two people at the same moment", () => {
  it("keeps the first: the second waits, then is told who changed the indicators", async () => {
    const ani = await addTestAccount(own.db, "Kepala Ani", ["head_of_unit"]);
    const budi = await addTestAccount(own.db, "Kepala Budi", ["head_of_unit"]);
    const { version } = await readIndicators(own.db);
    const before = await settingCount();

    const both = await own.atOnce(
      (db) => saveIndicators(db, ani, withFirst("Kemandirian"), version),
      (db) => saveIndicators(db, budi, withFirst("Mandiri Diri"), version),
    );

    expect(both.sooner).toEqual(SAVED);
    expect(both.later).toEqual({
      ok: false,
      error: "Indikator sudah diubah oleh Kepala Ani. Muat ulang.",
    });
    expect(await settingCount()).toBe(before + 1);
    const inForce = await readIndicators(own.db);
    expect(inForce.indicators[0]?.name).toBe("Kemandirian");
    expect(inForce.set?.by).toBe("Kepala Ani");
  });
});

describe("Simpan indikator pressed twice on one form at the same moment", () => {
  it("saves once, and says it is saved both times", async () => {
    const ani = await addTestAccount(own.db, "Kepala Ani", ["head_of_unit"]);
    const { version } = await readIndicators(own.db);
    const before = await settingCount();
    const sent = withFirst("Kemandirian Diri");

    const both = await own.atOnce(
      (db) => saveIndicators(db, ani, sent, version),
      (db) => saveIndicators(db, ani, sent, version),
    );

    expect(both).toEqual({ sooner: SAVED, later: SAVED });
    expect(await settingCount()).toBe(before + 1);
  });
});
