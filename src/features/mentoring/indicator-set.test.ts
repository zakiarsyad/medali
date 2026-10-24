import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { accounts, mentoringIndicatorSets } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { STARTING_INDICATORS } from "@/mentoring/score-indicators";
import { readIndicators, STARTING_INDICATORS_VERSION } from "./indicator-set";

const inTestDatabase = withTestDatabase();

async function addAccount(db: Database, name: string): Promise<string> {
  const [account] = await db.insert(accounts).values({ name }).returning();
  if (!account) throw new Error("The account was not added.");
  return account.id;
}

function renamed(first: string) {
  return STARTING_INDICATORS.map((indicator, place) =>
    place === 0 ? { ...indicator, name: first } : indicator,
  );
}

describe("readIndicators", () => {
  it("gives the starting indicators while none has been set", async () => {
    await inTestDatabase(async (db) => {
      expect(await readIndicators(db)).toEqual({
        indicators: STARTING_INDICATORS,
        version: STARTING_INDICATORS_VERSION,
        set: null,
      });
    });
  });

  it("gives the latest setting, with who set it and when", async () => {
    await inTestDatabase(async (db) => {
      const setBy = await addAccount(db, "Kepala Uji Baca Indikator");
      const [first] = await db
        .insert(mentoringIndicatorSets)
        .values({
          indicators: renamed("Kemandirian"),
          before: [...STARTING_INDICATORS],
          setBy,
          setAt: new Date("2026-10-01T08:00:00Z"),
        })
        .returning();
      if (!first) throw new Error("The setting was not added.");
      const [second] = await db
        .insert(mentoringIndicatorSets)
        .values({
          indicators: renamed("Kemandirian Diri"),
          before: renamed("Kemandirian"),
          replaces: first.id,
          setBy,
          setAt: new Date("2026-10-02T08:00:00Z"),
        })
        .returning();

      const inForce = await readIndicators(db);
      expect(inForce.indicators[0]?.name).toBe("Kemandirian Diri");
      expect(inForce.version).toBe(second?.id);
      expect(inForce.set).toEqual({
        at: new Date("2026-10-02T08:00:00Z"),
        by: "Kepala Uji Baca Indikator",
      });
    });
  });
});
