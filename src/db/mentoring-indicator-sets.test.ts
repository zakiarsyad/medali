import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { STARTING_INDICATORS } from "@/mentoring/score-indicators";
import type { Database } from "./connect";
import { accounts, mentoringIndicatorSets } from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

type Setting = typeof mentoringIndicatorSets.$inferInsert;

async function addAccount(db: Database): Promise<string> {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Kepala Uji Tabel Indikator" })
    .returning();
  if (!account) throw new Error("The account was not added.");
  return account.id;
}

function setting(setBy: string, more: Partial<Setting> = {}): Setting {
  return {
    indicators: STARTING_INDICATORS.map((indicator, place) => ({
      ...indicator,
      name: `Indikator Uji ${place + 1}`,
    })),
    before: [...STARTING_INDICATORS],
    replaces: null,
    setBy,
    setAt: new Date(),
    ...more,
  };
}

async function addSetting(db: Database, value: Setting): Promise<string> {
  const [added] = await db
    .insert(mentoringIndicatorSets)
    .values(value)
    .returning();
  if (!added) throw new Error("The setting was not added.");
  return added.id;
}

/** In a transaction of its own, so a refusal does not end the check's. */
function inOwnStep<Answer>(db: Database, step: (tx: Database) => Answer) {
  return db.transaction(async (tx) => step(tx));
}

describe("a setting of the mentoring score indicators", () => {
  it("keeps six indicators with the six before them, who set them and when", async () => {
    await inTestDatabase(async (db) => {
      const setBy = await addAccount(db);
      const id = await addSetting(db, setting(setBy));

      const [kept] = await db
        .select()
        .from(mentoringIndicatorSets)
        .where(eq(mentoringIndicatorSets.id, id));
      expect(kept?.indicators[0]).toEqual({
        name: "Indikator Uji 1",
        sentence: STARTING_INDICATORS[0]?.sentence,
      });
      expect(kept?.before).toEqual(STARTING_INDICATORS);
      expect(kept?.setBy).toBe(setBy);
      expect(kept?.setAt).toEqual(expect.any(Date));
    });
  });

  it.each<[string, Partial<Setting>]>([
    ["five indicators", { indicators: STARTING_INDICATORS.slice(0, 5) }],
    [
      "seven indicators",
      {
        indicators: [
          ...STARTING_INDICATORS,
          ...STARTING_INDICATORS.slice(0, 1),
        ],
      },
    ],
    ["five indicators before", { before: STARTING_INDICATORS.slice(0, 5) }],
  ])("is refused with %s", async (_, more) => {
    await inTestDatabase(async (db) => {
      const setBy = await addAccount(db);

      await expect(
        inOwnStep(db, (tx) => addSetting(tx, setting(setBy, more))),
      ).rejects.toThrow();
    });
  });

  it("replaces another setting at most once, the starting indicators among them", async () => {
    await inTestDatabase(async (db) => {
      const setBy = await addAccount(db);
      const first = await addSetting(db, setting(setBy));

      await expect(
        inOwnStep(db, (tx) => addSetting(tx, setting(setBy))),
      ).rejects.toThrow();
      await addSetting(db, setting(setBy, { replaces: first }));
      await expect(
        inOwnStep(db, (tx) =>
          addSetting(tx, setting(setBy, { replaces: first })),
        ),
      ).rejects.toThrow();
    });
  });

  it("cannot be changed, deleted or emptied", async () => {
    await inTestDatabase(async (db) => {
      const setBy = await addAccount(db);
      const id = await addSetting(db, setting(setBy));

      await expect(
        inOwnStep(db, (tx) =>
          tx
            .update(mentoringIndicatorSets)
            .set({ setAt: new Date() })
            .where(eq(mentoringIndicatorSets.id, id)),
        ),
      ).rejects.toThrow();
      await expect(
        inOwnStep(db, (tx) =>
          tx
            .delete(mentoringIndicatorSets)
            .where(eq(mentoringIndicatorSets.id, id)),
        ),
      ).rejects.toThrow();
      await expect(
        db.execute(sql`truncate mentoring_indicator_sets`),
      ).rejects.toThrow();
    });
  });
});
